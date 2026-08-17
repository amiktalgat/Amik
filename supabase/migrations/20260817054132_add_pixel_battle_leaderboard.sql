create or replace function public.get_pixel_battle_leaderboard()
returns table (
  rank integer,
  user_id uuid,
  username text,
  placed_pixels integer,
  best_streak integer
)
language sql
security definer
set search_path = public
as $$
  select
    row_number() over (order by placed_pixels desc, best_streak desc, created_at asc)::integer as rank,
    user_id,
    username,
    placed_pixels,
    best_streak
  from public.pixel_battle_profiles
  where placed_pixels > 0
  order by placed_pixels desc, best_streak desc, created_at asc
  limit 10;
$$;

grant execute on function public.get_pixel_battle_leaderboard() to anon, authenticated;
