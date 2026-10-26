# Videodaki konuşmayı kelime kelime zaman damgalı metne çevirir (yerel, ses dışarı gitmez).
# Kullanım: .venv/bin/python yazi.py <video> <çıktı.json>
import sys, json, mlx_whisper

video, cikti = sys.argv[1], sys.argv[2]
r = mlx_whisper.transcribe(video, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="tr", word_timestamps=True)
kelimeler = [{"w": w["word"].strip(), "s": round(w["start"], 3), "e": round(w["end"], 3)} for s in r["segments"] for w in s["words"]]
json.dump(kelimeler, open(cikti, "w"), ensure_ascii=False)
