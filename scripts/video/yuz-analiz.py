# Yüz + duygu analizi: ham çekimleri saniye aralıklı duygu bölümlerine ayırır.
# MediaPipe Face Landmarker (52 ifade katsayısı + baş açısı) + ses enerjisi + konuşma metni.
#
# Kullanım: .venv-yuz/bin/python yuz-analiz.py <video> <metin.json> <çıktı.json>
#   metin.json: yazi.py çıktısı (kelime zamanları) — konuşma/sessizlik ayrımı için
# Çıktı: { kareler: [...10 fps ölçümler], bolumler: [{bas, son, duygu, konusma, guven, ...}] }
import json, math, subprocess, sys, tempfile, os
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision

video, metin_json, cikti = sys.argv[1], sys.argv[2], sys.argv[3]
KOK = os.path.dirname(os.path.abspath(__file__))
FPS = 10

# 1) Doğru yönde (iPhone döndürmesi uygulanmış), küçük, 10 fps kareler.
W, H = 540, 960
ham = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={FPS},scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    capture_output=True, check=True,
).stdout
kareler = np.frombuffer(ham, np.uint8).reshape(-1, H, W, 3)

# 2) Ses enerjisi (konuşma/sessizlik için), kare başına RMS dB.
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
ses = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768 if pcm else np.zeros(1)
adim = 16000 // FPS
rms_db = [20 * math.log10(max(1e-5, float(np.sqrt(np.mean(ses[i * adim:(i + 1) * adim] ** 2))) if len(ses[i * adim:(i + 1) * adim]) else 1e-5)) for i in range(len(kareler))]

kelimeler = json.load(open(metin_json))
def konusuyor(t):
    return any(w["s"] - 0.05 <= t <= w["e"] + 0.05 for w in kelimeler)

# 3) Yüz ölçümü.
algilayici = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
    base_options=mpt.BaseOptions(model_asset_path=os.path.join(KOK, "analiz", "face_landmarker.task")),
    running_mode=vision.RunningMode.VIDEO, output_face_blendshapes=True, output_facial_transformation_matrixes=True, num_faces=1,
))

def aci(m):
    # Dönüşüm matrisinden yaw/pitch/roll (derece).
    r = np.array(m)[:3, :3]
    yaw = math.degrees(math.atan2(-r[2, 0], math.hypot(r[2, 1], r[2, 2])))
    pitch = math.degrees(math.atan2(r[2, 1], r[2, 2]))
    roll = math.degrees(math.atan2(r[1, 0], r[0, 0]))
    return round(yaw, 1), round(pitch, 1), round(roll, 1)

olcum = []
for i, k in enumerate(kareler):
    t = i / FPS
    s = algilayici.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(k)), int(t * 1000))
    kayit = {"t": round(t, 1), "db": round(rms_db[i], 1), "konusma": konusuyor(t)}
    if s.face_blendshapes:
        b = {c.category_name: c.score for c in s.face_blendshapes[0]}
        xs = [p.x for p in s.face_landmarks[0]]; ys = [p.y for p in s.face_landmarks[0]]
        yaw, pitch, roll = aci(s.facial_transformation_matrixes[0])
        kayit.update({
            "yuz": True,
            "gulumseme": round((b["mouthSmileLeft"] + b["mouthSmileRight"]) / 2, 3),
            "kas_kalkik": round(max(b["browInnerUp"], (b["browOuterUpLeft"] + b["browOuterUpRight"]) / 2), 3),
            "kas_catik": round((b["browDownLeft"] + b["browDownRight"]) / 2, 3),
            "goz_acik": round((b["eyeWideLeft"] + b["eyeWideRight"]) / 2, 3),
            "goz_kapali": round((b["eyeBlinkLeft"] + b["eyeBlinkRight"]) / 2, 3),
            "goz_yukari": round((b["eyeLookUpLeft"] + b["eyeLookUpRight"]) / 2, 3),
            "goz_yana": round(max(b["eyeLookOutLeft"], b["eyeLookOutRight"]), 3),
            # Ağız açıklığı iç dudak noktalarından (13 üst, 14 alt) / yüz boyu — sakal çene ölçümünü bozuyor.
            "agiz_acik": round(abs(s.face_landmarks[0][14].y - s.face_landmarks[0][13].y) / max(1e-3, max(ys) - min(ys)), 3),
            "dudak_buzuk": round((b["mouthPressLeft"] + b["mouthPressRight"]) / 2 + b["mouthPucker"] / 2, 3),
            "yaw": yaw, "pitch": pitch, "roll": roll,
            # Kadraj: yüz kutusu (oran) — yakın/uzak çekim ve ortalama için.
            "yuz_boy": round(max(ys) - min(ys), 3), "yuz_x": round((max(xs) + min(xs)) / 2, 3), "yuz_y": round((max(ys) + min(ys)) / 2, 3),
        })
    else:
        kayit["yuz"] = False
    olcum.append(kayit)

# 4) Duygu sınıflaması (yarım saniyelik pencere ortalaması). Eşikler Eser'in çekimlerinde gözle
#    doğrulandı: sakal çene katsayısını bastırıyor → ağız iç dudaktan; kahkahada kaşlar da çatılıyor.
def duygu(p):
    if not p["yuz"]:
        return "yuz-yok"
    if p["gulumseme"] > 0.52:
        return "gulme"
    if p["kas_kalkik"] > 0.42:
        return "sasirma"
    if p["gulumseme"] > 0.3:
        return "gulumseme"
    if p["kas_catik"] > 0.4:
        return "sert"
    if (p["goz_yukari"] > 0.35 or p["goz_yana"] > 0.45 or abs(p["yaw"]) > 18) and not p["konusma"]:
        return "dusunme"
    return "notr"

def pencere(i):
    p = olcum[max(0, i - 2): i + 3]
    yuzlu = [x for x in p if x.get("yuz")]
    if not yuzlu:
        return {"yuz": False, "konusma": olcum[i]["konusma"]}
    o = {k: float(np.mean([x[k] for x in yuzlu])) for k in ["gulumseme", "kas_kalkik", "kas_catik", "goz_acik", "goz_yukari", "goz_yana", "agiz_acik", "yaw"]}
    o.update({"yuz": True, "konusma": olcum[i]["konusma"]})
    return o

etiket = [duygu(pencere(i)) for i in range(len(olcum))]

# 5) Ardışık aynı etiketleri bölümlere birleştir; 0,6 sn'den kısa parçaları komşusuna kat.
bolumler = []
for i, e in enumerate(etiket):
    k = (e, olcum[i]["konusma"])
    if bolumler and bolumler[-1]["_k"] == k:
        bolumler[-1]["son"] = round((i + 1) / FPS, 1)
    else:
        bolumler.append({"_k": k, "bas": round(i / FPS, 1), "son": round((i + 1) / FPS, 1), "duygu": e, "konusma": olcum[i]["konusma"]})
degisti = True
while degisti and len(bolumler) > 1:
    degisti = False
    for j, b in enumerate(bolumler):
        if b["son"] - b["bas"] < 0.6:
            hedef = bolumler[j - 1] if j > 0 else bolumler[j + 1]
            hedef["bas"], hedef["son"] = min(hedef["bas"], b["bas"]), max(hedef["son"], b["son"])
            bolumler.pop(j); degisti = True
            break
    # komşu aynıysa birleştir
    j = 1
    while j < len(bolumler):
        if bolumler[j]["_k"] == bolumler[j - 1]["_k"]:
            bolumler[j - 1]["son"] = bolumler[j]["son"]; bolumler.pop(j)
        else:
            j += 1

for b in bolumler:
    b.pop("_k")
    p = [x for x in olcum if b["bas"] <= x["t"] < b["son"] and x.get("yuz")]
    b["metin"] = " ".join(w["w"] for w in kelimeler if b["bas"] - 0.1 <= w["s"] < b["son"])
    if p:
        b["ortalama"] = {k: round(float(np.mean([x[k] for x in p])), 2) for k in ["gulumseme", "kas_kalkik", "kas_catik", "agiz_acik", "yaw", "pitch", "yuz_boy"]}
        # Ağız sessizlikte de kıpırdıyor mu? (dudak senkronsuz kullanımda önemli)
        b["agiz_hareketi"] = round(float(np.std([x["agiz_acik"] for x in p])), 3)
    b["sure"] = round(b["son"] - b["bas"], 1)

json.dump({"video": video, "fps": FPS, "sure": round(len(olcum) / FPS, 1), "kareler": olcum, "bolumler": bolumler}, open(cikti, "w"), ensure_ascii=False)
for b in bolumler:
    print(f'{b["bas"]:5.1f}-{b["son"]:5.1f}  {b["duygu"]:9} {"KONUŞUYOR" if b["konusma"] else "sessiz   "}  {b.get("ortalama", {})}  {b["metin"][:50]}')
