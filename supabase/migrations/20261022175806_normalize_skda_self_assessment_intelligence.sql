begin;

create table if not exists public.skda_self_assessment_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  diagnosis_id uuid not null references public.skda_diagnoses(id) on delete cascade,
  snapshot_id uuid null references public.skda_self_assessment_snapshots(id) on delete set null,
  block_code text not null check (block_code in ('GOVERNANCA','GESTAO')),
  metric_kind text not null check (metric_kind in ('overall_index','criterion','history','benchmark')),
  metric_code text not null,
  metric_name text not null,
  reference_year integer null check (reference_year between 1900 and 2200),
  comparator_code text not null default 'COOPERATIVA',
  comparator_label text null,
  metric_value numeric(12,4) not null,
  unit text not null default 'percent',
  source_label text null,
  source_reference text null,
  confidence_level text not null default 'high' check (confidence_level in ('low','moderate','high','very_high')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique (diagnosis_id,block_code,metric_kind,metric_code,reference_year,comparator_code)
);

create index if not exists skda_sa_metrics_diagnosis_idx
  on public.skda_self_assessment_metrics(diagnosis_id,block_code,metric_kind);

alter table public.skda_self_assessment_metrics enable row level security;

grant select,insert,update,delete on public.skda_self_assessment_metrics to authenticated;
grant all on public.skda_self_assessment_metrics to service_role;

drop trigger if exists set_skda_self_assessment_metrics_updated_at on public.skda_self_assessment_metrics;
create trigger set_skda_self_assessment_metrics_updated_at
before update on public.skda_self_assessment_metrics
for each row execute function public.set_updated_at();

drop policy if exists skda_sa_metrics_select on public.skda_self_assessment_metrics;
create policy skda_sa_metrics_select
on public.skda_self_assessment_metrics for select
to authenticated
using (public.has_module_access(organization_id,'SK-DA'));

drop policy if exists skda_sa_metrics_write on public.skda_self_assessment_metrics;
create policy skda_sa_metrics_write
on public.skda_self_assessment_metrics for all
to authenticated
using (public.has_module_permission(organization_id,'SK-DA','assessment.edit'))
with check (public.has_module_permission(organization_id,'SK-DA','assessment.edit'));

-- Baseline real já socializada: RECICLE A VIDA, ciclo 2026.
with d as (
  select id,organization_id
  from public.skda_diagnoses
  where organization_id='7f2190b5-efc4-420d-a622-359b7587b54e'::uuid
    and code='DA-PP-PDGC-2026'
  limit 1
),
snap_gov as (
  select s.id from public.skda_self_assessment_snapshots s,d
  where s.diagnosis_id=d.id and s.metadata->>'block'='GOVERNANCA'
  order by s.source_date desc nulls last, s.captured_at desc limit 1
),
snap_mgt as (
  select s.id from public.skda_self_assessment_snapshots s,d
  where s.diagnosis_id=d.id and s.metadata->>'block'='GESTAO'
  order by s.source_date desc nulls last, s.captured_at desc limit 1
)
insert into public.skda_self_assessment_metrics (
  organization_id,diagnosis_id,snapshot_id,block_code,metric_kind,metric_code,metric_name,
  reference_year,comparator_code,comparator_label,metric_value,source_label,source_reference,metadata
)
select d.organization_id,d.id,v.snapshot_id,v.block_code,v.metric_kind,v.metric_code,v.metric_name,
       v.reference_year,v.comparator_code,v.comparator_label,v.metric_value,
       v.source_label,v.source_reference,v.metadata
from d
cross join lateral (
values
  ((select id from snap_gov),'GOVERNANCA','overall_index','ISGC','Índice Sescoop de Governança da Cooperativa',2026,'COOPERATIVA','Cooperativa',90.06,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  (null::uuid,'GOVERNANCA','history','ISGC','Índice Sescoop de Governança da Cooperativa',2025,'COOPERATIVA','Cooperativa',73.64,'AA Governança 2025','Governança 2025.pdf','{"historical_cycle":true}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','benchmark','ISGC','Índice Sescoop de Governança da Cooperativa',2026,'PREMIO','Reconhecidas último ciclo do Prêmio',93.06,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','benchmark','ISGC','Índice Sescoop de Governança da Cooperativa',2026,'BRASIL','Brasil',64.27,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','benchmark','ISGC','Índice Sescoop de Governança da Cooperativa',2026,'RAMO_BRASIL','Ramo Trabalho, Produção de Bens e Serviços · Brasil',61.74,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','benchmark','ISGC','Índice Sescoop de Governança da Cooperativa',2026,'RAMO_REGIAO','Ramo Trabalho, Produção de Bens e Serviços · Região',62.94,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','benchmark','ISGC','Índice Sescoop de Governança da Cooperativa',2026,'RAMO_ESTADO','Ramo Trabalho, Produção de Bens e Serviços · Estado',70.53,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),

  ((select id from snap_mgt),'GESTAO','overall_index','ISG','Índice Sescoop de Gestão',2026,'COOPERATIVA','Cooperativa',83.83,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  (null::uuid,'GESTAO','history','ISG','Índice Sescoop de Gestão',2025,'COOPERATIVA','Cooperativa',82.80,'AA Gestão 2025','Identidade 2025.pdf','{"historical_cycle":true}'::jsonb),
  ((select id from snap_mgt),'GESTAO','benchmark','ISG','Índice Sescoop de Gestão',2026,'PREMIO','Reconhecidas último ciclo do Prêmio',92.04,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','benchmark','ISG','Índice Sescoop de Gestão',2026,'BRASIL','Brasil',66.98,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','benchmark','ISG','Índice Sescoop de Gestão',2026,'RAMO_BRASIL','Ramo Trabalho, Produção de Bens e Serviços · Brasil',59.35,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','benchmark','ISG','Índice Sescoop de Gestão',2026,'RAMO_REGIAO','Ramo Trabalho, Produção de Bens e Serviços · Região',65.89,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','benchmark','ISG','Índice Sescoop de Gestão',2026,'RAMO_ESTADO','Ramo Trabalho, Produção de Bens e Serviços · Estado',69.08,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),

  ((select id from snap_gov),'GOVERNANCA','criterion','COOPERADOS','Cooperados',2026,'COOPERATIVA','Cooperativa',100.00,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','criterion','ASSEMBLEIA_GERAL','Assembleia Geral',2026,'COOPERATIVA','Cooperativa',100.00,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','criterion','CONSELHO_ADMINISTRACAO','Conselho de Administração/Diretoria',2026,'COOPERATIVA','Cooperativa',93.33,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','criterion','CONSELHO_FISCAL','Conselho Fiscal',2026,'COOPERATIVA','Cooperativa',100.00,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','criterion','GESTAO_EXECUTIVA','Gestão Executiva',2026,'COOPERATIVA','Cooperativa',100.00,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','criterion','COMITES_AUDITORIAS','Comitês e Auditorias',2026,'COOPERATIVA','Cooperativa',0.00,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),
  ((select id from snap_gov),'GOVERNANCA','criterion','RESULTADOS','Resultados',2026,'COOPERATIVA','Cooperativa',65.00,'AA Governança 2026','Sistema OCB - Governança - 2026.pdf','{}'::jsonb),

  ((select id from snap_mgt),'GESTAO','criterion','LIDERANCA','Liderança',2026,'COOPERATIVA','Cooperativa',91.38,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','criterion','ESTRATEGIAS_PLANOS','Estratégias e Planos',2026,'COOPERATIVA','Cooperativa',94.00,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','criterion','CLIENTES','Clientes',2026,'COOPERATIVA','Cooperativa',83.33,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','criterion','SOCIEDADE','Sociedade',2026,'COOPERATIVA','Cooperativa',90.00,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','criterion','INFORMACOES_CONHECIMENTO','Informações e Conhecimento',2026,'COOPERATIVA','Cooperativa',100.00,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','criterion','PESSOAS','Pessoas',2026,'COOPERATIVA','Cooperativa',100.00,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','criterion','PROCESSOS','Processos',2026,'COOPERATIVA','Cooperativa',90.00,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb),
  ((select id from snap_mgt),'GESTAO','criterion','RESULTADOS','Resultados',2026,'COOPERATIVA','Cooperativa',64.00,'AA Gestão 2026','Sistema OCB - Gestão - 2026.pdf','{}'::jsonb)
) as v(snapshot_id,block_code,metric_kind,metric_code,metric_name,reference_year,comparator_code,comparator_label,metric_value,source_label,source_reference,metadata)
on conflict (diagnosis_id,block_code,metric_kind,metric_code,reference_year,comparator_code)
do update set
  snapshot_id=excluded.snapshot_id,
  metric_name=excluded.metric_name,
  comparator_label=excluded.comparator_label,
  metric_value=excluded.metric_value,
  source_label=excluded.source_label,
  source_reference=excluded.source_reference,
  metadata=public.skda_self_assessment_metrics.metadata || excluded.metadata,
  updated_at=timezone('utc',now());

commit;
