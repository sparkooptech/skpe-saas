-- Governed read for native SK-DA journey. No direct table grants.
create or replace function public.get_skda_journey(
  target_journey_id uuid,
  target_organization_id uuid
) returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
  v_journey public.skda_journeys%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria.' using errcode = '42501';
  end if;
  if target_organization_id is null or target_journey_id is null then
    raise exception 'Identificadores DA obrigatorios.' using errcode = '22023';
  end if;
  if not (public.is_platform_super_admin() or public.is_organization_admin(target_organization_id)) then
    raise exception 'Acesso nao autorizado a jornada DA.' using errcode = '42501';
  end if;
  select * into v_journey from public.skda_journeys
  where id = target_journey_id and organization_id = target_organization_id;
  if not found then
    raise exception 'Jornada DA nao encontrada nesta organizacao.' using errcode = '22023';
  end if;
  return jsonb_build_object(
    'id',v_journey.id,
    'organizationId',v_journey.organization_id,
    'instrumentId',v_journey.instrument_id,
    'assessmentCycleId',v_journey.assessment_cycle_id,
    'kind',v_journey.journey_kind,
    'status',v_journey.status,
    'initiativeId',v_journey.initiative_id,
    'checklistExecutionId',v_journey.checklist_execution_id,
    'consultantUserId',v_journey.consultant_user_id,
    'organizationRepresentativeUserId',v_journey.organization_representative_user_id,
    'representativeIsProvisional',v_journey.representative_is_provisional
  );
end;
$function$;
revoke all on function public.get_skda_journey(uuid,uuid) from public,anon;
grant execute on function public.get_skda_journey(uuid,uuid) to authenticated;
