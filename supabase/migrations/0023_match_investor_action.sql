-- INVEST — eşleştirmede yatırımcı aksiyonu (görüşme talebi / geç) + izlenme takibi.
-- Analiz: hangi yatırımcı hangi girişimle ne yaptı (requested/skipped) ve ne zaman gördü.
alter table inv_matches add column if not exists investor_action text
  check (investor_action in ('requested', 'skipped'));
alter table inv_matches add column if not exists action_at timestamptz;
alter table inv_matches add column if not exists viewed_at timestamptz;
