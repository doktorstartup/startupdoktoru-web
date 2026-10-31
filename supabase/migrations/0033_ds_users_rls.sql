-- ds_users RLS sıkılaştırma: herkese açık okuma + herkese açık ekleme + kendi satırını
-- güncelleme (role='admin' yazıp admin politikalarını açabiliyordu) kaldırılır.
-- Kullanıcı yalnız kendi satırını okur (admin politikalarındaki EXISTS alt sorgusu çalışmaya devam eder).
-- Yazma yalnız service-role ile (RLS'i zaten aşar). Uygulama kodu bu tabloya istemciden dokunmuyor.
DROP POLICY IF EXISTS "Allow public read access to ds_users" ON public.ds_users;
DROP POLICY IF EXISTS "Allow individuals to update their own ds_user profile" ON public.ds_users;
DROP POLICY IF EXISTS "Allow system insertions on ds_user creation" ON public.ds_users;

CREATE POLICY "Users read own ds_user row" ON public.ds_users
  FOR SELECT USING (auth.uid() = id);
