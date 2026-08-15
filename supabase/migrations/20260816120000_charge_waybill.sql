create or replace function public.create_waybill_and_charge(
  p_vehicle_type_id uuid,
  p_start_odometer numeric,
  p_end_odometer numeric,
  p_start_fuel numeric,
  p_fuel_used numeric,
  p_fuel_added numeric,
  p_end_fuel numeric,
  p_total_km numeric,
  p_trips jsonb default '[]'::jsonb,
  p_refuels jsonb default '[]'::jsonb,
  p_charge numeric default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_driver_id uuid := auth.uid();
  v_balance numeric;
  v_waybill_id uuid;
  v_waybill jsonb;
begin
  if v_driver_id is null then
    raise exception 'Необходима авторизация';
  end if;

  if p_charge <= 0 then
    raise exception 'Некорректная сумма списания';
  end if;

  if not exists (
    select 1 from profiles
    where id = v_driver_id
      and role = 'driver'
      and is_active = true
  ) then
    raise exception 'Водитель не найден или заблокирован';
  end if;

  update profiles
     set balance = coalesce(balance, 0) - p_charge
   where id = v_driver_id
     and coalesce(balance, 0) >= p_charge
   returning balance into v_balance;

  if not found then
    raise exception 'Недостаточно средств на балансе. Нужно 5 ₽';
  end if;

  insert into waybills (
    driver_id,
    vehicle_type_id,
    start_odometer,
    end_odometer,
    start_fuel,
    fuel_used,
    fuel_added,
    end_fuel,
    total_km,
    status,
    completed_at
  ) values (
    v_driver_id,
    p_vehicle_type_id,
    p_start_odometer,
    p_end_odometer,
    p_start_fuel,
    p_fuel_used,
    p_fuel_added,
    p_end_fuel,
    p_total_km,
    'completed',
    now()
  )
  returning id into v_waybill_id;

  insert into waybill_trips (waybill_id, city_km, highway_km, fuel_used)
  select
    v_waybill_id,
    coalesce((x->>'city')::numeric, 0),
    coalesce((x->>'highway')::numeric, 0),
    coalesce((x->>'fuel')::numeric, 0)
  from jsonb_array_elements(coalesce(p_trips, '[]'::jsonb)) x;

  insert into waybill_refuels (waybill_id, litres, fuel_type)
  select
    v_waybill_id,
    coalesce(value::numeric, 0),
    'АИ-92'
  from jsonb_array_elements(coalesce(p_refuels, '[]'::jsonb)) value
  where coalesce(value::numeric, 0) > 0;

  insert into balance_transactions (
    driver_id,
    amount,
    type,
    description,
    created_by
  ) values (
    v_driver_id,
    -p_charge,
    'charge',
    'Расчёт путёвки',
    v_driver_id
  );

  select to_jsonb(w) into v_waybill
  from waybills w
  where w.id = v_waybill_id;

  return jsonb_build_object(
    'waybill', v_waybill,
    'charged', p_charge,
    'balance', v_balance
  );
exception
  when others then
    raise;
end;
$$;

grant execute on function public.create_waybill_and_charge(
  uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, jsonb, jsonb, numeric
) to authenticated;
