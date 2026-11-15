-- LinkedIn blog paylaşımı 09:00 → 08:30 TR (05:30 UTC): okurlar işe başlamadan, yoldayken görsün (2026-11-15, Eser kararı).
-- Aynı adla schedule mevcut işi günceller.
select cron.schedule('linkedin-blog', '30 5 * * *', 'select public.linkedin_blog_tetikle()');
