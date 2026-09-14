-- Run once in the dedicated project's SQL Editor (or copy into a CLI migration).
begin;

create table public.fit90_leads (
  id uuid primary key,
  program text not null default 'fit90' check (program = 'fit90'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  phone text not null check (phone ~ '^\+[0-9]{9,15}$'),
  email text check (email is null or char_length(email) <= 254),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  source text not null default 'bruno_samora_landing' check (source = 'bruno_samora_landing'),
  consent_version text not null default 'fit90-contact-v1',
  consent_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','contacted','qualified','converted','lost')),
  crm_external_id text,
  crm_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fit90_leads_created_id_idx on public.fit90_leads (created_at, id);
create index fit90_leads_phone_created_idx on public.fit90_leads (phone, created_at);
create index fit90_leads_pending_sync_idx on public.fit90_leads (created_at, id) where crm_synced_at is null;

alter table public.fit90_leads enable row level security;
revoke all on public.fit90_leads from anon, authenticated;
grant select, insert, update, delete on public.fit90_leads to service_role;
-- No anonymous/authenticated policies: contacts cannot be listed from the browser.

create function public.touch_fit90_lead()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.touch_fit90_lead() from public, anon, authenticated;
create trigger fit90_leads_updated_at before update on public.fit90_leads
for each row execute function public.touch_fit90_lead();

create function public.submit_fit90_lead(payload jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  lead_id uuid := (payload->>'id')::uuid;
  lead_phone text := payload->>'phone';
begin
  -- Serialize repeated request IDs, then per-number limits, across all workers.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('fit90-id:' || lead_id::text, 0));
  if exists(select 1 from public.fit90_leads where id = lead_id) then
    return lead_id;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('fit90-phone:' || lead_phone, 0));
  if (select count(*) from public.fit90_leads where phone = lead_phone and created_at > now() - interval '1 hour') >= 3 then
    raise exception using errcode = 'P0001', message = 'rate_limit';
  end if;
  insert into public.fit90_leads (id, name, phone, email, answers)
  values (lead_id, payload->>'name', lead_phone, payload->>'email', payload->'answers');
  return lead_id;
end;
$$;
revoke all on function public.submit_fit90_lead(jsonb) from public, anon, authenticated;
grant execute on function public.submit_fit90_lead(jsonb) to service_role;

comment on table public.fit90_leads is 'Fit 90: contactos autorizados e respostas do quiz. Integração CRM apenas no servidor.';
notify pgrst, 'reload schema';
commit;
