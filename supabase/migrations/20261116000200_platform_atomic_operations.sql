-- Nohva Platform: atomic sale/payment RPCs and function hardening
-- Additive migration. Does not modify the existing public catalog tables.

create or replace function public.platform_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.platform_profiles p
  where p.user_id = auth.uid()
    and p.active = true
  limit 1;
$$;

create or replace function public.platform_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.platform_role() = 'owner', false);
$$;

create or replace function public.platform_create_sale(
  p_client_name text,
  p_client_phone text,
  p_channel text,
  p_due_date date,
  p_notes text,
  p_items jsonb,
  p_initial_payment jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale_id uuid;
  v_total numeric(12,2);
  v_item_count integer;
  v_payment numeric(12,2);
begin
  if v_user_id is null or public.platform_role() not in ('owner', 'employee') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe incluir al menos un producto' using errcode = '22023';
  end if;

  select count(*),
         round(coalesce(sum(
           (nullif(item->>'quantity',''))::integer *
           (nullif(item->>'unit_price_usd',''))::numeric
         ), 0), 2)
    into v_item_count, v_total
  from jsonb_array_elements(p_items) item
  where jsonb_typeof(item) = 'object'
    and coalesce((item->>'quantity')::integer, 0) > 0
    and coalesce((item->>'unit_price_usd')::numeric, -1) >= 0
    and nullif(trim(item->>'product_name'), '') is not null;

  if v_item_count <> jsonb_array_length(p_items) or v_total <= 0 then
    raise exception 'Hay productos o cantidades inválidas' using errcode = '22023';
  end if;

  insert into public.platform_sales
    (seller_id, client_name, client_phone, channel, due_date, total_usd, notes)
  values
    (v_user_id, nullif(trim(p_client_name), ''), nullif(trim(p_client_phone), ''),
     nullif(trim(p_channel), ''), p_due_date, v_total, nullif(trim(p_notes), ''))
  returning id into v_sale_id;

  insert into public.platform_sale_items
    (sale_id, product_id, product_name, quantity, unit_price_usd)
  select
    v_sale_id,
    nullif(item->>'product_id', ''),
    trim(item->>'product_name'),
    (item->>'quantity')::integer,
    (item->>'unit_price_usd')::numeric
  from jsonb_array_elements(p_items) item;

  if p_initial_payment is not null then
    v_payment := round((p_initial_payment->>'amount_usd')::numeric, 2);
    if v_payment <= 0 or v_payment > v_total then
      raise exception 'El abono inicial debe ser mayor que cero y no superar el total' using errcode = '22023';
    end if;

    insert into public.platform_payments
      (sale_id, recorded_by, amount_usd, payment_method, amount_bs, exchange_rate, reference)
    values
      (v_sale_id, v_user_id, v_payment,
       nullif(trim(p_initial_payment->>'payment_method'), ''),
       nullif(p_initial_payment->>'amount_bs', '')::numeric,
       nullif(p_initial_payment->>'exchange_rate', '')::numeric,
       nullif(trim(p_initial_payment->>'reference'), ''));
  end if;

  return v_sale_id;
end;
$$;

create or replace function public.platform_add_payment(
  p_sale_id uuid,
  p_amount_usd numeric,
  p_payment_method text,
  p_amount_bs numeric default null,
  p_exchange_rate numeric default null,
  p_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_seller_id uuid;
  v_total numeric(12,2);
  v_paid numeric(12,2);
  v_payment_id uuid;
begin
  if v_user_id is null or public.platform_role() not in ('owner', 'employee') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select s.seller_id, s.total_usd
    into v_seller_id, v_total
  from public.platform_sales s
  where s.id = p_sale_id
  for update;

  if not found then
    raise exception 'Venta no encontrada' using errcode = 'P0002';
  end if;

  if not public.platform_is_owner() and v_seller_id <> v_user_id then
    raise exception 'No autorizado para registrar abonos en esta venta' using errcode = '42501';
  end if;

  select coalesce(sum(p.amount_usd), 0)
    into v_paid
  from public.platform_payments p
  where p.sale_id = p_sale_id;

  if p_amount_usd is null or p_amount_usd <= 0 or round(v_paid + p_amount_usd, 2) > v_total then
    raise exception 'El abono supera el saldo pendiente o es inválido' using errcode = '22023';
  end if;

  insert into public.platform_payments
    (sale_id, recorded_by, amount_usd, payment_method, amount_bs, exchange_rate, reference)
  values
    (p_sale_id, v_user_id, round(p_amount_usd, 2), nullif(trim(p_payment_method), ''),
     p_amount_bs, p_exchange_rate, nullif(trim(p_reference), ''))
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

revoke all on function public.platform_create_sale(text,text,text,date,text,jsonb,jsonb) from public, anon;
revoke all on function public.platform_add_payment(uuid,numeric,text,numeric,numeric,text) from public, anon;
grant execute on function public.platform_create_sale(text,text,text,date,text,jsonb,jsonb) to authenticated;
grant execute on function public.platform_add_payment(uuid,numeric,text,numeric,numeric,text) to authenticated;

-- Explicitly restrict helper execution to authenticated sessions.
revoke all on function public.platform_role() from public, anon;
revoke all on function public.platform_is_owner() from public, anon;
grant execute on function public.platform_role() to authenticated;
grant execute on function public.platform_is_owner() to authenticated;
