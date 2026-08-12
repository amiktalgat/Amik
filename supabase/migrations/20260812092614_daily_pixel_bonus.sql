alter table public.pixel_battle_profiles
  alter column balance set default 0;

alter table public.pixel_battle_profiles
  add column if not exists last_daily_bonus_at timestamptz;

create or replace function public.get_pixel_battle_profile()
returns public.pixel_battle_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.pixel_battle_profiles;
  should_give_bonus boolean;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  insert into public.pixel_battle_profiles (user_id, username, email)
  values (
    auth.uid(),
    left(coalesce(nullif(auth.jwt()->>'email', ''), 'player'), 24),
    coalesce(auth.jwt()->>'email', '')
  )
  on conflict (user_id) do nothing;

  select * into current_profile
  from public.pixel_battle_profiles
  where user_id = auth.uid()
  for update;

  should_give_bonus := current_profile.last_daily_bonus_at is null
    or current_profile.last_daily_bonus_at <= now() - interval '24 hours';

  if should_give_bonus then
    update public.pixel_battle_profiles
    set balance = least(100, current_profile.balance + 40),
        last_daily_bonus_at = now(),
        last_recharge_at = now(),
        last_login_at = now(),
        updated_at = now()
    where user_id = auth.uid()
    returning * into current_profile;
  else
    update public.pixel_battle_profiles
    set last_login_at = now(),
        updated_at = now()
    where user_id = auth.uid()
    returning * into current_profile;
  end if;

  return current_profile;
end;
$$;
