-- Run after 00. Deleting a board now removes every row that hangs off it.

alter table columns drop constraint if exists columns_board_id_fkey;
alter table columns add constraint columns_board_id_fkey
  foreign key (board_id) references boards(id) on delete cascade;

alter table tags drop constraint if exists tags_board_id_fkey;
alter table tags add constraint tags_board_id_fkey
  foreign key (board_id) references boards(id) on delete cascade;

alter table cards drop constraint if exists cards_column_id_fkey;
alter table cards add constraint cards_column_id_fkey
  foreign key (column_id) references columns(id) on delete cascade;

alter table card_history drop constraint if exists card_history_card_id_fkey;
alter table card_history add constraint card_history_card_id_fkey
  foreign key (card_id) references cards(id) on delete cascade;

alter table card_tags drop constraint if exists card_tags_card_id_fkey;
alter table card_tags add constraint card_tags_card_id_fkey
  foreign key (card_id) references cards(id) on delete cascade;

alter table card_tags drop constraint if exists card_tags_tag_id_fkey;
alter table card_tags add constraint card_tags_tag_id_fkey
  foreign key (tag_id) references tags(id) on delete cascade;

delete from card_history where card_id is null;
