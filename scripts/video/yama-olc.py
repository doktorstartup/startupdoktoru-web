# Yama (leke) ölçer: dudak senkronu çıktısında ağız/çene bölgesi gerçek çekime göre bozuldu mu?
# lipsync modeli alt yüzü yeniden çizer; Eser'in kırlaşmış sakalını bazen pürüzsüz, parlak beyaz bir
# lekeye çeviriyor (E2VC_v3 giriş sahnesi, 2026-11-10). Dudak kapanma testi bunu görmez.
# Ölçüm: alt dudak (17) ile çene ucu (152) arası, ağız köşeleri (61–291) genişliğinde bölge.
#   doku  = çıktı / referans Laplace varyansı (sakal teli dokusu; ortanca < 0,4 = pürüzsüz yama)
#   Kalibrasyon (E2VC_v3 giriş): ham lipsync 0,25 = LEKE (gözle görüldü); sakal-onar.py sonrası 0,51 = temiz.
#   Yeniden kodlama + bükme dokuyu biraz yumuşatır, temiz çıktı da 1,0 olmaz.
#   parlak = çıktı − referans ortalama parlaklık (0–255; > 12 = beyazlaşma)
#
# Kullanım: .venv-yuz/bin/python yama-olc.py <çıktı.mp4> <referans.mp4> [--kaydir sn]
#   --kaydir: çıktı t anı = referansın t + kaydir anı (dudak.mjs'de bağlam payı, 0,35)
# Çıktı son satırı: YAMA doku <ortanca> parlak <ortanca> kötü-kare %<oran> → TEMİZ | LEKE
import subprocess, sys, os
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision

cikti, ref = sys.argv[1], sys.argv[2]
KAY = float(sys.argv[sys.argv.index("--kaydir") + 1]) if "--kaydir" in sys.argv else 0.0
KOK = os.path.dirname(os.path.abspath(__file__))
FPS, W, H = 10, 540, 960

def kareler(video, bas=0.0):
    ham = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{bas}", "-i", video, "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(ham, np.uint8).reshape(-1, H, W, 3)

A, B = kareler(cikti), kareler(ref, KAY)
n = min(len(A), len(B))
alg = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
    base_options=mpt.BaseOptions(model_asset_path=os.path.join(KOK, "analiz", "face_landmarker.task")),
    running_mode=vision.RunningMode.IMAGE, num_faces=1))

def bolge(kare):
    s = alg.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(kare)))
    if not s.face_landmarks:
        return None
    L = s.face_landmarks[0]
    x0, x1 = int(L[61].x * W), int(L[291].x * W)
    y0, y1 = int(L[17].y * H), int(L[152].y * H)
    return (x0, y0, x1, y1) if x1 - x0 > 10 and y1 - y0 > 6 else None

doku, parlak = [], []
for i in range(n):
    k = bolge(B[i])  # bölgeyi gerçek kareden al (yamalı karede yüz noktaları da kayabilir)
    if not k:
        continue
    x0, y0, x1, y1 = k
    ga = cv2.cvtColor(A[i][y0:y1, x0:x1], cv2.COLOR_RGB2GRAY).astype(np.float32)
    gb = cv2.cvtColor(B[i][y0:y1, x0:x1], cv2.COLOR_RGB2GRAY).astype(np.float32)
    va, vb = cv2.Laplacian(ga, cv2.CV_32F).var(), cv2.Laplacian(gb, cv2.CV_32F).var()
    doku.append(va / max(vb, 1e-3)); parlak.append(float(ga.mean() - gb.mean()))
if not doku:
    sys.exit("yüz bulunamadı")
doku, parlak = np.array(doku), np.array(parlak)
kotu = float(np.mean((doku < 0.4) | (parlak > 12)))
sonuc = "LEKE" if np.median(doku) < 0.4 or np.median(parlak) > 12 else "TEMİZ"
print(f"YAMA doku {np.median(doku):.2f} parlak {np.median(parlak):+.1f} kötü-kare %{kotu * 100:.0f} → {sonuc}  {os.path.basename(cikti)}")
