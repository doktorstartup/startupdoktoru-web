-- Kaydırmalı postun LinkedIn belgesi (slaytlar.pdf) paylasim-video kovasına yüklenebilsin (0054).
update storage.buckets
set allowed_mime_types = array(select distinct unnest(allowed_mime_types || array['application/pdf']))
where id = 'paylasim-video';
