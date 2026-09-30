-- INVEST — görüşme talebi süreç takibi. Yatırımcı "Request a meeting" der (investor_action='requested');
-- admin bunu ayarlayana kadar BEKLEYEN sayılır. meeting_status ile süreç izlenir.
-- Bekleyen = investor_action='requested' AND meeting_status IN (null,'open').
alter table inv_matches add column if not exists meeting_status text
  check (meeting_status in ('open', 'scheduled', 'done', 'passed'));
