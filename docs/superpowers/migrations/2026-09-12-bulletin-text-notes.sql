-- Bulletin: text notes and board height
-- Run in the Supabase SQL editor before deploying feature/bulletin-text-and-board-size.
-- Spec: docs/superpowers/specs/2026-09-12-bulletin-text-notes-and-board-height-design.md

alter table bulletin_items
  add column type text not null default 'image' check (type in ('image', 'text')),
  add column content text,
  add column font text,
  add column font_size integer,
  add column text_color text,
  add column note_color text;
alter table bulletin_items alter column image_url drop not null;

create table bulletin_settings (
  id integer primary key default 1 check (id = 1),
  board_height integer not null default 800
);
insert into bulletin_settings (id) values (1);

-- Verify:
-- select type, count(*) from bulletin_items group by type;
-- select * from bulletin_settings;
