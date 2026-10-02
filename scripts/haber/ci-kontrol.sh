#!/usr/bin/env bash
# CI KOŞULUNU TAKLİT EDER.
#
# haber.yml bilerek npm install YAPMIYOR: toplayıcının sıfır bağımlılığı var.
# Ama regresyon testi yanlışlıkla ağır bir modülü (playwright-core,
# @supabase/supabase-js) import ederse CI her koşuda ERR_MODULE_NOT_FOUND ile
# düşer ve haber toplama hiç çalışmaz. Bu iki kez yaşandı: 13 Eylül
# (varlik.mjs) ve 29 Eylül (gorsel.mjs + yazi.mjs).
#
# Testleri node_modules'suz koşturur. Değişiklikten sonra ÇALIŞTIR.
set -u
cd "$(dirname "$0")/../.."
GEC=$(mktemp -d)
geri() { [ -d "$GEC/root" ] && mv "$GEC/root" node_modules; [ -d "$GEC/haber" ] && mv "$GEC/haber" scripts/haber/node_modules; rmdir "$GEC" 2>/dev/null; }
trap geri EXIT INT TERM
[ -d node_modules ] && mv node_modules "$GEC/root"
[ -d scripts/haber/node_modules ] && mv scripts/haber/node_modules "$GEC/haber"

echo "— node_modules gizlendi, CI koşulu —"
cikti=$(node scripts/haber/regresyon.test.mjs 2>&1); rc=$?
echo "$cikti" | tail -25
node scripts/haber/tur-haberi-mi.test.mjs >/dev/null 2>&1 || rc=1
echo
if [ $rc -eq 0 ]; then
  echo "✓ CI'da geçer"
# Import hatası ile başarısız test AYRI şeyler; mesaj ikisini karıştırmasın.
elif echo "$cikti" | grep -q "ERR_MODULE_NOT_FOUND"; then
  echo "✗ CI'DA DÜŞER — testin import ettiği bir modül ağır bağımlılık çekiyor"
else
  echo "✗ test başarısız (bağımlılık sorunu değil — yukarıdaki satırlara bak)"
fi
exit $rc
