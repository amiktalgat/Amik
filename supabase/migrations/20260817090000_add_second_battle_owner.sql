create or replace function public.place_battle_pixels(
  pixel_x integer,
  pixel_y integer,
  pixel_color text,
  brush_size integer default 1,
  erase_pixels boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.pixel_battle_profiles;
  current_window timestamptz;
  current_attempts integer;
  is_owner boolean;
  safe_size integer;
  half_size integer;
  start_x integer;
  start_y integer;
  end_x integer;
  end_y integer;
  affected_count integer;
  next_balance integer;
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

  current_profile := public.get_pixel_battle_profile();
  is_owner := lower(current_profile.email) in ('amiktalgat@gmail.com', 'david3747god@gmail.com');
  safe_size := case
    when is_owner then least(greatest(brush_size, 1), 4)
    else 1
  end;

  if erase_pixels and not is_owner then
    raise exception 'owner_only';
  end if;

  half_size := floor(safe_size / 2);
  start_x := greatest(0, pixel_x - half_size);
  start_y := greatest(0, pixel_y - half_size);
  end_x := least(1999, start_x + safe_size - 1);
  end_y := least(1999, start_y + safe_size - 1);
  start_x := greatest(0, end_x - safe_size + 1);
  start_y := greatest(0, end_y - safe_size + 1);

  create temp table if not exists changed_battle_pixels (
    next_x integer,
    next_y integer
  ) on commit drop;

  truncate table changed_battle_pixels;

  if erase_pixels then
    delete from public.canvas_pixels
    where x between start_x and end_x
      and y between start_y and end_y;
    get diagnostics affected_count = row_count;
  else
    select count(*)
    into affected_count
    from generate_series(start_x, end_x) as next_x
    cross join generate_series(start_y, end_y) as next_y
    left join public.canvas_pixels pixel
      on pixel.x = next_x and pixel.y = next_y
    where pixel.color is distinct from upper(pixel_color);
  end if;

  if not is_owner and affected_count > 0 then
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

    if current_profile.balance <= 0 then
      raise exception 'no_pixels';
    end if;
  end if;

  if not erase_pixels and affected_count > 0 then
    insert into changed_battle_pixels (next_x, next_y)
    select brush_x, brush_y
    from generate_series(start_x, end_x) as brush_x
    cross join generate_series(start_y, end_y) as brush_y
    left join public.canvas_pixels pixel
      on pixel.x = brush_x and pixel.y = brush_y
    where pixel.color is distinct from upper(pixel_color);

    insert into public.canvas_pixels (x, y, color, user_id, updated_at)
    select next_x, next_y, upper(pixel_color), auth.uid(), now()
    from changed_battle_pixels
    on conflict (x, y)
    do update set color = excluded.color,
                  user_id = excluded.user_id,
                  updated_at = excluded.updated_at;

    insert into public.pixel_events (x, y, color, user_id)
    select next_x, next_y, upper(pixel_color), auth.uid()
    from changed_battle_pixels;
  end if;

  next_balance := case
    when is_owner or affected_count = 0 then current_profile.balance
    else current_profile.balance - 1
  end;

  update public.pixel_battle_profiles
  set balance = next_balance,
      placed_pixels = case
        when erase_pixels then placed_pixels
        else placed_pixels + affected_count
      end,
      best_streak = case
        when erase_pixels then best_streak
        else greatest(best_streak, placed_pixels + affected_count)
      end,
      updated_at = now()
  where user_id = auth.uid()
  returning * into current_profile;

  return jsonb_build_object(
    'x', pixel_x,
    'y', pixel_y,
    'color', upper(pixel_color),
    'balance', current_profile.balance,
    'placedPixels', current_profile.placed_pixels,
    'brushSize', safe_size,
    'erased', erase_pixels,
    'affected', affected_count,
    'pixels', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'x', next_x,
        'y', next_y,
        'color', upper(pixel_color),
        'user_id', auth.uid(),
        'updated_at', now()
      )), '[]'::jsonb)
      from generate_series(start_x, end_x) as next_x
      cross join generate_series(start_y, end_y) as next_y
      left join public.canvas_pixels pixel
        on pixel.x = next_x and pixel.y = next_y
      where erase_pixels
        or exists (
          select 1
          from changed_battle_pixels changed
          where changed.next_x = next_x and changed.next_y = next_y
        )
    )
  );
end;
$$;

grant execute on function public.place_battle_pixels(integer, integer, text, integer, boolean) to authenticated;
