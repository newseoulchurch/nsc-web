-- Bulletin: note text alignment
-- Run in the Supabase SQL editor BEFORE deploying feature/bulletin-note-align-and-fonts.
-- Nullable on purpose: image rows leave it null, and the app treats a missing value as 'left'.

alter table bulletin_items
  add column text_align text check (text_align in ('left', 'center', 'right'));

-- Verify:
-- select type, text_align, count(*) from bulletin_items group by type, text_align;
