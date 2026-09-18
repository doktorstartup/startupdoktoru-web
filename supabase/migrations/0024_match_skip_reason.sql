-- INVEST — yatırımcı bir girişimi "geç"tiğinde nedeni (gelecekte daha iyi eşleştirme sinyali).
alter table inv_matches add column if not exists skip_reason text;
