create or replace function public.place_battle_pixel(pixel_x integer, pixel_y integer, pixel_color text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.pixel_battle_profiles;
  new_balance integer;
  current_window timestamptz;
  current_attempts integer;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if pixel_x < 0 or pixel_x >= 2000 or pixel_y < 0 or pixel_y >= 2000 then
    raise exception 'bad_coordinates';
  end if;

  if pixel_color is null or pixel_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'bad_color';
  end if;

  insert into public.pixel_rate_limits (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select window_started_at, attempts
  into current_window, current_attempts
  from public.pixel_rate_limits
  where user_id = auth.uid()
  for update;

  if current_window < now() - interval '1 second' then
    update public.pixel_rate_limits
    set window_started_at = now(), attempts = 1
    where user_id = auth.uid();
  elsif current_attempts >= 8 then
    raise exception 'rate_limited';
  else
    update public.pixel_rate_limits
    set attempts = attempts + 1
    where user_id = auth.uid();
  end if;

  current_profile := public.get_pixel_battle_profile();

  if current_profile.balance <= 0 then
    raise exception 'no_pixels';
  end if;

  new_balance := current_profile.balance - 1;

  insert into public.canvas_pixels (x, y, color, user_id, updated_at)
  values (pixel_x, pixel_y, upper(pixel_color), auth.uid(), now())
  on conflict (x, y)
  do update set color = excluded.color,
                user_id = excluded.user_id,
                updated_at = excluded.updated_at;

  insert into public.pixel_events (x, y, color, user_id)
  values (pixel_x, pixel_y, upper(pixel_color), auth.uid());

  update public.pixel_battle_profiles
  set balance = new_balance,
      placed_pixels = placed_pixels + 1,
      best_streak = greatest(best_streak, placed_pixels + 1),
      updated_at = now()
  where user_id = auth.uid()
  returning * into current_profile;

  return jsonb_build_object(
    'x', pixel_x,
    'y', pixel_y,
    'color', upper(pixel_color),
    'balance', current_profile.balance,
    'placedPixels', current_profile.placed_pixels
  );
end;
$$;
