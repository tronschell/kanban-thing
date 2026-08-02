-- Emergency rollback for block B of 06 only. Restores anon reads to the post-04 state and leaves the 04 write lockdown in place.

begin;

grant select on
  public.columns,
  public.cards,
  public.card_history,
  public.tags,
  public.card_tags
to anon, authenticated;

grant select (id, created_at, name, expires_at) on public.boards to anon, authenticated;

commit;
