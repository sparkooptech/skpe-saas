\set ON_ERROR_STOP on
begin;
set local lock_timeout = '10s';
do $guard$
begin
  if not exists (select 1 from public.skda_diagnoses where id='79f8b0dc-371e-4483-bfad-542cdbb37724' and organization_id='bd58a170-b5ef-4150-9b69-026afa138661' and reference_year=2026 and archived_at is null) then
    raise exception 'CNTCOOP 2026 journey missing or mismatched';
  end if;
  if not exists (select 1 from public.skda_self_assessment_snapshots where diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724' and assessment_cycle_year=2026 and source_section='Governança') then
    raise exception 'CNTCOOP Governance 2026 AA snapshot missing';
  end if;
end $guard$;
insert into public.skda_self_assessment_metrics
(organization_id,diagnosis_id,block_code,metric_kind,metric_code,metric_name,reference_year,comparator_code,metric_value,unit,source_label,source_reference,confidence_level,metadata)
values
('bd58a170-b5ef-4150-9b69-026afa138661','79f8b0dc-371e-4483-bfad-542cdbb37724','GOVERNANCA','overall_index','ISGC','ISGC autodeclarado',2026,'COOPERATIVA',76.20,'percent','Relatorio - Governanca - 2026 - CNTCoop(3).pdf','Relatorio - Governanca - 2026 - CNTCoop(3).pdf, pagina 3','high','{"source_kind":"AA_REPORTED","validation_status":"self_declared_not_consultant_validated","source_page":3,"comparability":"not_yet_validated"}'::jsonb)
on conflict (diagnosis_id,block_code,metric_kind,metric_code,reference_year,comparator_code) do nothing;
do $verify$
begin
  if not exists (select 1 from public.skda_self_assessment_metrics where diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724' and block_code='GOVERNANCA' and metric_kind='overall_index' and reference_year=2026 and comparator_code='COOPERATIVA' and metric_value=76.20) then
    raise exception 'CNTCOOP 2026 governance index conflict; manual reconciliation required';
  end if;
end $verify$;
commit;
