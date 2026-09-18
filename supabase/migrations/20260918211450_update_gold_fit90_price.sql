begin;

-- Keep historical Gold selections at 289.000 Kz valid while all new
-- submissions are priced at 279.000 Kz by submit_fit90_lead.
alter table public.fit90_leads
  drop constraint fit90_leads_offer_check;

alter table public.fit90_leads
  add constraint fit90_leads_offer_check check (
    (num_nonnulls(training_frequency, recommended_plan, selected_plan, selected_price_kz) = 0)
    or (
      num_nonnulls(training_frequency, recommended_plan, selected_plan, selected_price_kz) = 4
      and training_frequency in ('2 vezes por semana', '3 vezes por semana', '4 vezes ou mais', 'Quero ter liberdade para treinar quando quiser')
      and selected_plan in ('light', 'performance', 'gold')
      and recommended_plan = case training_frequency
        when '2 vezes por semana' then 'light'
        when '3 vezes por semana' then 'performance'
        else 'gold' end
      and (
        (selected_plan = 'light' and selected_price_kz = 199000)
        or (selected_plan = 'performance' and selected_price_kz = 249000)
        or (selected_plan = 'gold' and selected_price_kz in (279000, 289000))
      )
    )
  );

create or replace function public.submit_fit90_lead(payload jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  lead_id uuid := (payload->>'id')::uuid;
  lead_phone text := payload->>'phone';
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('fit90-id:' || lead_id::text, 0));
  if exists(select 1 from public.fit90_leads where id = lead_id) then
    return lead_id;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('fit90-phone:' || lead_phone, 0));
  if (select count(*) from public.fit90_leads where phone = lead_phone and created_at > now() - interval '1 hour') >= 3 then
    raise exception using errcode = 'P0001', message = 'rate_limit';
  end if;
  insert into public.fit90_leads (id, name, phone, email, answers, training_frequency, recommended_plan, selected_plan, selected_price_kz, consent_version)
  values (
    lead_id, payload->>'name', lead_phone, payload->>'email', payload->'answers',
    payload->>'training_frequency',
    case payload->>'training_frequency'
      when '2 vezes por semana' then 'light'
      when '3 vezes por semana' then 'performance'
      when '4 vezes ou mais' then 'gold'
      when 'Quero ter liberdade para treinar quando quiser' then 'gold'
      else null end,
    payload->>'selected_plan',
    case payload->>'selected_plan' when 'light' then 199000 when 'performance' then 249000 when 'gold' then 279000 else null end,
    case when payload->>'training_frequency' is null then 'fit90-contact-v1' else 'fit90-contact-v2' end
  );
  return lead_id;
end;
$$;

revoke all on function public.submit_fit90_lead(jsonb) from public, anon, authenticated;
grant execute on function public.submit_fit90_lead(jsonb) to service_role;

notify pgrst, 'reload schema';
commit;
