-- Misafir (auth'suz) checkout için ds_orders'a kimlikleme kolonları ekle.
-- Webhook, ödemeyi e-posta ile kaydeder; auth gelince user_id bağlanır.
ALTER TABLE public.ds_orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.ds_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
