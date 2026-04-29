-- ============================================================
-- Fix: check_rate_limit estava referenciando colunas inexistentes
-- (identifier, request_count, window_seconds, max_requests).
-- A tabela rate_limits real tem (key, count, window_start).
-- Esse bug afetava submit-contact e submit-provider-intake
-- (ambos retornavam 429 silenciosamente quando o RPC falhava
-- com "column does not exist" porque `data` ficava null e
-- `allowed !== true` virava verdadeiro no client).
-- ============================================================

drop function if exists public.check_rate_limit(text, integer, integer);

create function public.check_rate_limit(
  p_key text,
  p_max_requests integer default 10,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_count int;
  v_window_start timestamptz;
begin
  select count, window_start
    into v_count, v_window_start
  from rate_limits
  where key = p_key;

  if not found then
    insert into rate_limits (key, count, window_start)
    values (p_key, 1, now())
    on conflict (key) do update
      set count = 1, window_start = now();
    return true;
  end if;

  -- janela expirou → reset
  if v_window_start + (p_window_seconds || ' seconds')::interval < now() then
    update rate_limits
       set count = 1, window_start = now()
     where key = p_key;
    return true;
  end if;

  -- excedeu limite
  if v_count >= p_max_requests then
    return false;
  end if;

  -- incrementa contador
  update rate_limits
     set count = count + 1
   where key = p_key;
  return true;
end;
$$;
