# Dudak senkronu ölçer — "dudak kapanma testi".
# b / m / p sesleri dudaklar kapanmadan çıkamaz. Kelime zamanlarından bu seslerin anını tahmin eder,
# o an civarında (±0,1 sn) videodaki ağzın kapanıp kapanmadığına bakar (MediaPipe iç dudak 13–14).
# Ses dinlenemediği için kaymayı sayıyla yakalar. (Ses zarfı korelasyonu bu çekimlerde güvenilmez:
# sakal + oda sesi yüzünden gerçek çekim bile 0,1–0,3 çıkıyor — denendi, bırakıldı.)
#
# Kullanım:
#   .venv-yuz/bin/python senkron-olc.py <video.mp4> <kelimeler.json> [--bas sn] [--son sn] [--kaydir sn]
#     kelimeler.json: [{w,s,e}] listesi veya kurgu.json (içindeki "kelimeler" alınır)
#     --bas/--son: kelimeler bu aralıktan alınır; --kaydir: video zamanı = kelime zamanı - kaydir
#     (dudak sahnesi için: --bas <sahne başı> --son <sahne sonu> --kaydir <sahne başı>)
# Çıktı: her b/m/p için kapanma oranı (o anki en dar ağız / konuşma ortancası). < 0,45 = kapandı ✓.
# SKOR = kapanan / toplam. Gerçek çekimde kalibrasyon: bkz. tasarimciV1.md / E2VC_v3 notu.
import json, subprocess, sys, os
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision

def secenek(ad, varsayilan):
    return float(sys.argv[sys.argv.index(ad) + 1]) if ad in sys.argv else varsayilan

video, kelime_dosya = sys.argv[1], sys.argv[2]
BAS, SON, KAY = secenek("--bas", 0.0), secenek("--son", 1e9), secenek("--kaydir", 0.0)
ESIK = 0.45
KOK = os.path.dirname(os.path.abspath(__file__))
FPS = 30

k = json.load(open(kelime_dosya))
kelimeler = [w for w in (k["kelimeler"] if isinstance(k, dict) else k) if w["s"] >= BAS - 0.01 and w["s"] < SON]

ham = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={FPS},scale=540:960", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
kareler = np.frombuffer(ham, np.uint8).reshape(-1, 960, 540, 3)
alg = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
    base_options=mpt.BaseOptions(model_asset_path=os.path.join(KOK, "analiz", "face_landmarker.task")),
    running_mode=vision.RunningMode.VIDEO, num_faces=1))
agiz = []
for i, kare in enumerate(kareler):
    s = alg.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(kare)), int(i * 1000 / FPS))
    if s.face_landmarks:
        L = s.face_landmarks[0]; ys = [p.y for p in L]
        agiz.append(abs(L[14].y - L[13].y) / max(1e-3, max(ys) - min(ys)))
    else:
        agiz.append(np.nan)
agiz = np.array(agiz)

def vt(t):  # kelime zamanı → kare no
    return int(round((t - KAY) * FPS))

konusma = np.concatenate([agiz[max(0, vt(w["s"])):max(0, vt(w["e"]))] for w in kelimeler]) if kelimeler else agiz
ortanca = float(np.nanmedian(konusma)) or 1e-3

def harf(c):
    return c.lower() in "bmp"

sonuc = []
for w in kelimeler:
    yazi = [c for c in w["w"] if c.isalpha()]
    for j, c in enumerate(yazi):
        if not harf(c):
            continue
        # Harfin kelime içindeki tahmini anı (harf sayısıyla doğrusal); baştaki harf kelime başında.
        t = w["s"] + (w["e"] - w["s"]) * (j / max(1, len(yazi)))
        i0, i1 = max(0, vt(t - 0.1)), min(len(agiz), vt(t + 0.12) + 1)
        p = agiz[i0:i1]
        if i1 <= i0 or np.isnan(p).all():
            sonuc.append((w["w"], c, t, None)); continue
        oran = float(np.nanmin(p)) / ortanca
        sonuc.append((w["w"], c, t, oran))

gecerli = [s for s in sonuc if s[3] is not None]
kapanan = [s for s in gecerli if s[3] < ESIK]
for kel, c, t, oran in sonuc:
    durum = "yüz yok" if oran is None else ("✓" if oran < ESIK else "⚠ AÇIK")
    print(f"  {t - KAY:5.2f} sn  {kel:<22} '{c}'  oran {'-' if oran is None else f'{oran:.2f}'}  {durum}")
skor = len(kapanan) / len(gecerli) if gecerli else float("nan")
print(f"SKOR {skor:.2f}  ({len(kapanan)}/{len(gecerli)} b/m/p kapandı)  {os.path.basename(video)}")
