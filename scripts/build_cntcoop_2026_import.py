#!/usr/bin/env python3
"""Generate guarded, idempotent CNTCOOP 2026 AA import SQL for sparks_homol.

Source: 70-question reviewed staging matrix. Does not validate DA findings,
claim historical measures, or modify production.
"""
import json
import sys
from pathlib import Path

data = json.loads(Path(__file__).with_name("cntcoop-aa-2026-catalog-staging.json").read_text(encoding="utf-8-sig"))
items = data["items"]
official_metrics = data["official_metrics"]
assert len(official_metrics) == 35
assert sum(x["metric_kind"] == "overall_index" for x in official_metrics) == 2
assert sum(x["metric_kind"] == "criterion" for x in official_metrics) == 15
assert sum(x["metric_kind"] == "benchmark" for x in official_metrics) == 10
assert sum(x["metric_kind"] == "history" for x in official_metrics) == 8
assert len(items) == 70
assert sum(x["axis"] == "Governança" for x in items) == 24
assert sum(x["axis"] == "Gestão" for x in items) == 46
assert len({x["code"] for x in items}) == 70
assert all(x["declared"] in "ABCD" and len(x["alternatives"]) == 4 for x in items)
assert data["organization_id"] == "bd58a170-b5ef-4150-9b69-026afa138661"
assert data["diagnosis_id"] == "79f8b0dc-371e-4483-bfad-542cdbb37724"
payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
assert "$CNTCOOP_AA_2026$" not in payload
sys.stdout.reconfigure(encoding="utf-8")
print(r"""\set ON_ERROR_STOP on
begin;
set local lock_timeout = '10s';
set local statement_timeout = '90s';
create temporary table cntcoop_import_data (payload jsonb) on commit drop;
insert into cntcoop_import_data(payload) values ($CNTCOOP_AA_2026$""" + payload + r"""$CNTCOOP_AA_2026$::jsonb);
create temporary table cntcoop_import_items on commit drop as
select e.value as item from cntcoop_import_data d,
lateral jsonb_array_elements(d.payload->'items') e;
do $guard$
declare n integer; journey_catalog_id uuid; catalog_id uuid;
begin
  select count(*) into n from cntcoop_import_items;
  if n <> 70 or (select count(*) from cntcoop_import_items where item->>'axis'='Governança') <> 24
    or (select count(*) from cntcoop_import_items where item->>'axis'='Gestão') <> 46
    or (select count(distinct item->>'code') from cntcoop_import_items) <> 70 then
    raise exception 'CNTCOOP staging does not contain exactly 24 GOV + 46 GES unique questions';
  end if;
  if not exists (select 1 from public.skda_diagnoses
     where id='79f8b0dc-371e-4483-bfad-542cdbb37724'
       and organization_id='bd58a170-b5ef-4150-9b69-026afa138661'
       and reference_year=2026 and archived_at is null) then
    raise exception 'CNTCOOP 2026 journey not found or mismatched';
  end if;
  select id into catalog_id from public.skda_catalog_versions
   where code='PDGC-PP' and version_code='2025' and status='published';
  if catalog_id is null then raise exception 'PDGC-PP 2025 published catalog not found'; end if;
  select catalog_version_id into journey_catalog_id from public.skda_diagnoses
    where id='79f8b0dc-371e-4483-bfad-542cdbb37724' for update;
  if journey_catalog_id is not null and journey_catalog_id <> catalog_id then
    raise exception 'CNTCOOP journey linked to a different catalog';
  end if;
  select count(*) into n from public.skda_questions where catalog_version_id=catalog_id;
  if n not in (0,70) then raise exception 'Catalog has % questions; manual reconciliation required',n; end if;
  if n=70 and exists (
    select 1 from cntcoop_import_items i
    left join public.skda_questions q on q.catalog_version_id=catalog_id
      and q.code=i.item->>'code' and q.question_text=i.item->>'question'
    where q.id is null
  ) then raise exception 'Existing catalog questions differ from staging'; end if;
end $guard$;

with catalog as (
  select id from public.skda_catalog_versions where code='PDGC-PP' and version_code='2025'
)
insert into public.skda_questions
(catalog_version_id,code,axis_code,axis_name,criterion_name,question_text,
 score_weight,display_order,expected_evidence,metadata)
select c.id,i.item->>'code',
  case when i.item->>'axis'='Governança' then 'GOVERNANCA' else 'GESTAO' end,
  i.item->>'axis',i.item->>'criterion',i.item->>'question',
  (i.item->>'weight')::numeric,
  (substring(i.item->>'code' from '[0-9]+$'))::integer,
  jsonb_build_array(i.item->>'evidence'),
  jsonb_build_object('source','CNTCOOP 2026 AA staging','original_control_code',i.item->>'code',
    'source_sha256',(select payload->>'source_sha256' from cntcoop_import_data))
from cntcoop_import_items i cross join catalog c
on conflict (catalog_version_id,code) do nothing;

with catalog as (
  select id from public.skda_catalog_versions where code='PDGC-PP' and version_code='2025'
)
insert into public.skda_question_alternatives
(question_id,code,alternative_text,progression_order,metadata)
select q.id,chr(64+a.n),i.item->'alternatives'->>(a.n-1),a.n,
  jsonb_build_object('source','CNTCOOP 2026 AA staging')
from cntcoop_import_items i cross join catalog c
join public.skda_questions q on q.catalog_version_id=c.id and q.code=i.item->>'code'
cross join generate_series(1,4) as a(n)
on conflict (question_id,code) do nothing;

update public.skda_diagnoses d set catalog_version_id=c.id
from public.skda_catalog_versions c
where d.id='79f8b0dc-371e-4483-bfad-542cdbb37724'
  and d.organization_id='bd58a170-b5ef-4150-9b69-026afa138661'
  and c.code='PDGC-PP' and c.version_code='2025'
  and d.catalog_version_id is null;

insert into public.skda_self_assessment_snapshots
(organization_id,diagnosis_id,source_label,content_hash,assessment_cycle_year,
 source_document_name,source_section,import_status,metadata)
select 'bd58a170-b5ef-4150-9b69-026afa138661'::uuid,
 '79f8b0dc-371e-4483-bfad-542cdbb37724'::uuid,
 'Autoavaliação CNTCOOP 2026 — '||block.name,
 'cntcoop-aa-2026:'||(select payload->>'source_sha256' from cntcoop_import_data)||':'||block.code,
 2026,(select payload->>'source_file' from cntcoop_import_data),block.name,
 'pending_review',
 jsonb_build_object('block',block.code,'status','declared_not_validated',
  'source_sha256',(select payload->>'source_sha256' from cntcoop_import_data))
from (values ('GOVERNANCA','Governança'),('GESTAO','Gestão')) as block(code,name)
on conflict (diagnosis_id,content_hash) do nothing;

with catalog as (
  select id from public.skda_catalog_versions where code='PDGC-PP' and version_code='2025'
)
insert into public.skda_self_assessment_answers
(snapshot_id,question_id,declared_alternative_id,declared_code,declared_text,
 source_question_code,metadata)
select s.id,q.id,alt.id,i.item->>'declared',alt.alternative_text,
 i.item->>'code',
 jsonb_build_object('source_status','self_declared','prelocated_sources',i.item->>'source_ref',
 'source_note',i.item->>'source_note','original_control_code',i.item->>'code')
from cntcoop_import_items i cross join catalog c
join public.skda_questions q on q.catalog_version_id=c.id and q.code=i.item->>'code'
join public.skda_question_alternatives alt on alt.question_id=q.id and alt.code=i.item->>'declared'
join public.skda_self_assessment_snapshots s
  on s.diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'
 and s.content_hash='cntcoop-aa-2026:'||(select payload->>'source_sha256' from cntcoop_import_data)||':'||
   case when i.item->>'axis'='Governança' then 'GOVERNANCA' else 'GESTAO' end
on conflict (snapshot_id,question_id) do nothing;

with metric_rows as (
  select m.value as metric
  from cntcoop_import_data d,
  lateral jsonb_array_elements(d.payload->'official_metrics') m
),
snapshots as (
  select metadata->>'block' as block_code,id
  from public.skda_self_assessment_snapshots
  where diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'
    and assessment_cycle_year=2026
)
insert into public.skda_self_assessment_metrics
(organization_id,diagnosis_id,snapshot_id,block_code,metric_kind,metric_code,metric_name,
 reference_year,comparator_code,comparator_label,metric_value,unit,source_label,source_reference,
 confidence_level,metadata)
select
 'bd58a170-b5ef-4150-9b69-026afa138661'::uuid,
 '79f8b0dc-371e-4483-bfad-542cdbb37724'::uuid,
 case
   when (r.metric->>'reference_year')::integer=2026
    and r.metric->>'metric_kind' in ('overall_index','criterion','benchmark')
   then s.id else null
 end,
 r.metric->>'block_code',
 r.metric->>'metric_kind',
 r.metric->>'metric_code',
 r.metric->>'metric_name',
 (r.metric->>'reference_year')::integer,
 r.metric->>'comparator_code',
 nullif(r.metric->>'comparator_label',''),
 (r.metric->>'metric_value')::numeric,
 coalesce(nullif(r.metric->>'unit',''),'percent'),
 nullif(r.metric->>'source_label',''),
 nullif(r.metric->>'source_reference',''),
 coalesce(nullif(r.metric->>'confidence_level',''),'high'),
 coalesce(r.metric->'metadata','{}'::jsonb)
from metric_rows r
left join snapshots s on s.block_code=r.metric->>'block_code'
on conflict (diagnosis_id,block_code,metric_kind,metric_code,reference_year,comparator_code)
do update set
 snapshot_id=excluded.snapshot_id,
 metric_name=excluded.metric_name,
 comparator_label=excluded.comparator_label,
 metric_value=excluded.metric_value,
 unit=excluded.unit,
 source_label=excluded.source_label,
 source_reference=excluded.source_reference,
 confidence_level=excluded.confidence_level,
 metadata=public.skda_self_assessment_metrics.metadata || excluded.metadata,
 updated_at=timezone('utc',now());

do $verify$
declare n integer; gov integer; ges integer; cat uuid;
begin
  select catalog_version_id into cat from public.skda_diagnoses
   where id='79f8b0dc-371e-4483-bfad-542cdbb37724';
  select count(*) into n from public.skda_questions where catalog_version_id=cat;
  if n<>70 then raise exception 'Expected 70 catalog questions, got %',n; end if;
  select count(*) into n from public.skda_question_alternatives a
   join public.skda_questions q on q.id=a.question_id where q.catalog_version_id=cat;
  if n<>280 then raise exception 'Expected 280 alternatives, got %',n; end if;
  select count(*),count(*) filter(where s.source_section='Governança'),
    count(*) filter(where s.source_section='Gestão') into n,gov,ges
   from public.skda_self_assessment_answers a
   join public.skda_self_assessment_snapshots s on s.id=a.snapshot_id
   where s.diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'
     and s.assessment_cycle_year=2026;
  if n<>70 or gov<>24 or ges<>46 then
    raise exception 'Expected 70 answers (24 GOV/46 GES), got % (%/%).',n,gov,ges;
  end if;

  select count(*) into n
  from public.skda_self_assessment_metrics
  where diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'
    and metric_kind='overall_index' and reference_year=2026 and comparator_code='COOPERATIVA';
  if n<>2 then raise exception 'Expected 2 official 2026 overall indices, got %',n; end if;

  select count(*) into n
  from public.skda_self_assessment_metrics
  where diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'
    and metric_kind='criterion' and reference_year=2026 and comparator_code='COOPERATIVA';
  if n<>15 then raise exception 'Expected 15 official 2026 criterion metrics, got %',n; end if;

  select count(*) into n
  from public.skda_self_assessment_metrics
  where diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'
    and metric_kind='benchmark' and reference_year=2026;
  if n<>10 then raise exception 'Expected 10 official 2026 benchmark metrics, got %',n; end if;

  select count(*) into n
  from public.skda_self_assessment_metrics
  where diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'
    and metric_kind='history' and reference_year in (2021,2023,2024,2025);
  if n<>8 then raise exception 'Expected 8 historical block metrics for 2021/2023/2024/2025, got %',n; end if;

  raise notice 'CNTCOOP 2026 imported completely: 70 declared answers, 2 overall indices, 15 criterion metrics, 10 benchmarks and 8 historical block metrics';
end $verify$;
commit;
select 'CNTCOOP_2026_AA_IMPORTED' as status, count(*) as declared_answers
from public.skda_self_assessment_answers a
join public.skda_self_assessment_snapshots s on s.id=a.snapshot_id
where s.diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'
  and s.assessment_cycle_year=2026;
""")
