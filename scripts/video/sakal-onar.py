# Sakal onarımı: dudak senkronu çıktısında dudak altındaki çene/sakal bölgesini gerçek çekimden geri koyar.
# Sorun (E2VC_v3, 2026-11-10): lipsync modeli alt yüzü yeniden çizerken Eser'in kırlaşmış sakalını
# pürüzsüz, mavimsi-beyaz bir lekeye çeviriyor (en çok "Uzun anlatım" çekiminde: sakal parlak, mavi ışık).
# Yöntem: her karede çıktının yüz noktaları bulunur; alt dudağın altı → çene ucu bölgesi maskelenir.
# Referans karenin aynı bölgesi, çıktıdaki çene geometrisine (ağız köşeleri + çene ucu + alt dudak)
# afin bükülür, yumuşak kenarlı maskeyle yerleştirilir. Dudaklar ve ağız içi modelden kalır (senkron bozulmaz).
# Noktalar zamanda yumuşatılır (titreme olmasın).
#
# Kullanım: .venv-yuz/bin/python sakal-onar.py <çıktı.mp4> <referans.mp4> <hedef.mp4> [--kaydir sn]
#   --kaydir: çıktı t anı = referansın t + kaydir anı
import subprocess, sys, os
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision

cikti, ref, hedef = sys.argv[1], sys.argv[2], sys.argv[3]
KAY = float(sys.argv[sys.argv.index("--kaydir") + 1]) if "--kaydir" in sys.argv else 0.0
KOK = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30

def oku(video, bas=0.0):
    ham = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{bas}", "-i", video, "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(ham, np.uint8).reshape(-1, H, W, 3)

A, B = oku(cikti), oku(ref, KAY)
n = len(A)
if len(B) < n:  # referans kısa kalırsa son kareyle doldur
    B = np.concatenate([B, np.repeat(B[-1:], n - len(B), axis=0)])

def algilayici():
    return vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=os.path.join(KOK, "analiz", "face_landmarker.task")),
        running_mode=vision.RunningMode.VIDEO, num_faces=1))
alg_a, alg_b = algilayici(), algilayici()

def noktalar(alg, kare, i):
    s = alg.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(kare)), int(i * 1000 / FPS))
    if not s.face_landmarks:
        return None
    return np.array([[p.x * W, p.y * H] for p in s.face_landmarks[0]], np.float32)

# Alt dudak dış hattı (sol köşe → sağ köşe); maskenin üst sınırı.
ALT_DUDAK = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291]
DAYANAK = [61, 291, 17, 152, 200, 148, 377]  # afin eşleme noktaları

LA, LB = [], []
for i in range(n):
    LA.append(noktalar(alg_a, A[i], i)); LB.append(noktalar(alg_b, B[i], i))

def yumusat(L):
    # Eksik kareyi komşudan doldur, sonra 5 karelik hareketli ortalama.
    son = next((x for x in L if x is not None), None)
    dolu = []
    for x in L:
        son = x if x is not None else son
        dolu.append(son)
    if son is None:
        return None
    D = np.stack(dolu)
    k = 2
    return np.stack([D[max(0, i - k):i + k + 1].mean(0) for i in range(len(D))])

PA, PB = yumusat(LA), yumusat(LB)
if PA is None or PB is None:
    sys.exit("yüz bulunamadı")

enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", f"{FPS}", "-i", "-",
                        "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", hedef], stdin=subprocess.PIPE)
for i in range(n):
    a, b = PA[i], PB[i]
    # Maske: alt dudağın biraz altından çene ucunun biraz altına kadar (çene ucu 152, ağız köşeleri 61/291).
    yuz_boy = np.linalg.norm(a[10] - a[152])
    asagi = np.array([0, yuz_boy * 0.012], np.float32)  # dudak kenarından küçük pay: dudak modelde kalsın
    ust_hat = [a[j] + asagi for j in ALT_DUDAK]
    sol, sag, uc = a[61], a[291], a[152]
    genis = (sag - sol) * 0.22
    alt_hat = [sag + genis + np.array([0, yuz_boy * 0.05]), uc + np.array([0, yuz_boy * 0.03]), sol - genis + np.array([0, yuz_boy * 0.05])]
    poli = np.array(ust_hat + alt_hat, np.int32)
    maske = np.zeros((H, W), np.float32)
    cv2.fillPoly(maske, [poli], 1.0)
    yumus = int(yuz_boy * 0.035) | 1
    maske = cv2.GaussianBlur(maske, (yumus * 2 + 1, yumus * 2 + 1), 0)[..., None]
    # Referansı çıktının çene geometrisine bük.
    M, _ = cv2.estimateAffinePartial2D(b[DAYANAK], a[DAYANAK])
    bukuk = cv2.warpAffine(B[i], M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) if M is not None else B[i]
    kare = (A[i].astype(np.float32) * (1 - maske) + bukuk.astype(np.float32) * maske).astype(np.uint8)
    enc.stdin.write(kare.tobytes())
enc.stdin.close(); enc.wait()
print(f"✓ sakal onarıldı: {os.path.basename(hedef)} ({n} kare)")
