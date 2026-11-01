begin;

-- CNTCOOP | Reconciliation of contractual workload metadata
-- Canonical source already ratified in the Journey baseline: OI 227/2026.
-- The 25h agenda is distributed as 16h synchronous with the Organization
-- and 9h technical/off-line work.

update public.skda_diagnoses d
set metadata = coalesce(d.metadata,'{}'::jsonb) || jsonb_build_object(
      'contractual_source_reference','OI 227/2026',
      'contractual_technical_responsible_user_id','ee5056ab-ed54-47eb-a652-997ad447d819',
      'contractual_technical_responsible_name','Ricardo Rodrigues',
      'contractual_organization_hours',16,
      'contractual_technical_hours',9,
      'contractual_hours_breakdown_source','contractual_baseline_schedule',
      'contractual_hours_breakdown_validated_at',timezone('utc',now())
    ),
    updated_at=timezone('utc',now()),
    updated_by=coalesce(d.updated_by,d.created_by)
where d.id='79f8b0dc-371e-4483-bfad-542cdbb37724'
  and d.organization_id='bd58a170-b5ef-4150-9b69-026afa138661'
  and d.archived_at is null
  and coalesce((d.metadata->>'contracted_hours')::numeric,0)=25;

do $$
declare
  v_org_hours numeric;
  v_technical_hours numeric;
begin
  select
    coalesce((metadata->>'contractual_organization_hours')::numeric,0),
    coalesce((metadata->>'contractual_technical_hours')::numeric,0)
  into v_org_hours,v_technical_hours
  from public.skda_diagnoses
  where id='79f8b0dc-371e-4483-bfad-542cdbb37724';

  if v_org_hours <> 16 or v_technical_hours <> 9 then
    raise exception 'CNTCOOP contractual workload reconciliation failed: organization=% technical=%',
      v_org_hours,v_technical_hours;
  end if;

  raise notice 'CNTCOOP contractual workload reconciled: OI 227/2026 = 16h organization + 9h technical/off-line.';
end $$;

notify pgrst, 'reload schema';

commit;
