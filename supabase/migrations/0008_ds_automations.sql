-- Otomasyon (event → e-posta) yönetimi: admin'den aç/kapat + şablon düzenle.
CREATE TABLE IF NOT EXISTS public.ds_automations (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_desc TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ds_automations ENABLE ROW LEVEL SECURITY;
-- Politika yok: yalnızca service-role (admin API) erişir; anon erişemez.

-- Seed: mevcut 3 otomasyon. {{name}} ve {{site}} yer tutucuları desteklenir.
INSERT INTO public.ds_automations (key, name, trigger_desc, enabled, subject, body_html) VALUES
('welcome', 'Karşılama', 'Kayıt / lead (popup, AI, ücretsiz eğitim, üyelik)', true,
 'Hoş geldin — Startup Doktoru 🚀',
 '<h2 style="color:#0E1726">Hoş geldin {{name}}! 🎉</h2><p>Girişimini yatırım alınabilir, kârlı bir sisteme dönüştürme yolculuğuna katıldın.</p><p><strong>13 Adımda Milyon Dolarlık Startup</strong> e-kitabı şu an <span style="text-decoration:line-through;color:#9ca3af">12 $</span> yerine <strong style="color:#00B8CC">6 $</strong>.</p><p><a href="{{site}}/ebook" style="display:inline-block;background:#00B8CC;color:#001;padding:12px 22px;border-radius:10px;font-weight:bold;text-decoration:none">Hemen 6 $''a Sahip Ol →</a></p>'),
('abandoned', 'Sepeti Bırakanlar', 'Ödeme adımına geldi ama tamamlamadı', true,
 'Ödemeni tamamlamadın — sana özel hatırlatma 🛒',
 '<h2 style="color:#0E1726">Merhaba {{name}},</h2><p>Ödeme adımına kadar geldin ama tamamlamadın. Bir sorun mu oldu? Yardımcı olmak isteriz.</p><p><strong>13 Adımda Milyon Dolarlık Startup</strong> hâlâ seni bekliyor — sadece <strong style="color:#00B8CC">6 $</strong>.</p><p><a href="{{site}}/ebook" style="display:inline-block;background:#00B8CC;color:#001;padding:12px 22px;border-radius:10px;font-weight:bold;text-decoration:none">Ödememi Tamamla →</a></p>'),
('followup', 'Genel Takip', '2-5 gün önce kaydoldu, almadı', true,
 'Girişimin için bir sonraki adım — Startup Doktoru',
 '<h2 style="color:#0E1726">Merhaba {{name}},</h2><p>Geçen gün aramıza katıldın ama e-kitabı henüz edinmemişsin. Sana özel hatırlatma:</p><p><strong>13 Adımda Milyon Dolarlık Startup</strong> — değerleme, yatırımcı sunumu ve büyüme; hepsi tek el kitabında. Sadece <strong style="color:#00B8CC">6 $</strong>.</p><p><a href="{{site}}/ebook" style="display:inline-block;background:#00B8CC;color:#001;padding:12px 22px;border-radius:10px;font-weight:bold;text-decoration:none">E-Kitabı İncele →</a></p>')
ON CONFLICT (key) DO NOTHING;
