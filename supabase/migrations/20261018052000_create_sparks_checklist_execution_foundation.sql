-- CORE-CHK-001: additive execution storage. Do not apply before authorization.
-- No changes to legacy SK-PE checklist tables or existing catalog.
begin;

create table if not exists public.sparks_checklist_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_code text not null,
  template_version_id uuid not null references public.sparks_checklist_template_versions(id) on delete restrict,
  target_type text not null,
  target_id uuid not null,
  status text not null default 'draft',
  idempotency_key text not null,
  command_fingerprint text not null,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint sparks_chk_exec_module_nonempty check (length(trim(module_code)) > 0),
  constraint sparks_chk_exec_target_type check (target_type in ('sparks_initiative','skda_journey','skpe_project','organization')),
  constraint sparks_chk_exec_status check (status in ('draft','in_progress','under_review','completed','cancelled')),
  constraint sparks_chk_exec_key_nonempty check (length(trim(idempotency_key)) between 1 and 160),
  constraint sparks_chk_exec_fingerprint_nonempty check (length(trim(command_fingerprint)) > 0),
  constraint sparks_chk_exec_idempotent unique (organization_id,module_code,idempotency_key)
);
create index if not exists idx_sparks_chk_exec_target
  on public.sparks_checklist_executions(organization_id,module_code,target_type,target_id);

create table if not exists public.sparks_checklist_execution_items (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.sparks_checklist_executions(id) on delete cascade,
  template_item_id uuid not null references public.sparks_checklist_template_items(id) on delete restrict,
  status text not null default 'not_started',
  assigned_user_id uuid references public.profiles(id) on delete set null,
  due_date date,
  justification text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sparks_chk_item_status check (status in ('not_started','in_progress','fulfilled','partially_fulfilled','not_fulfilled','not_applicable','blocked')),
  constraint sparks_chk_item_unique unique (execution_id,template_item_id)
);

create table if not exists public.sparks_checklist_item_evidence (
  id uuid primary key default gen_random_uuid(),
  execution_item_id uuid not null references public.sparks_checklist_execution_items(id) on delete cascade,
  evidence_asset_id uuid not null references public.sparks_evidence_assets(id) on delete restrict,
  purpose text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  constraint sparks_chk_item_evidence_unique unique (execution_item_id,evidence_asset_id)
);

create table if not exists public.sparks_checklist_audit (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.sparks_checklist_executions(id) on delete cascade,
  action text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  before_state jsonb,
  after_state jsonb,
  change_reason text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint sparks_chk_audit_reason check (length(trim(change_reason)) >= 10)
);

-- Default deny: no client grants. RPC authorization/target validation must precede enablement.
alter table public.sparks_checklist_executions enable row level security;
alter table public.sparks_checklist_execution_items enable row level security;
alter table public.sparks_checklist_item_evidence enable row level security;
alter table public.sparks_checklist_audit enable row level security;
revoke all on public.sparks_checklist_executions from public,anon,authenticated;
revoke all on public.sparks_checklist_execution_items from public,anon,authenticated;
revoke all on public.sparks_checklist_item_evidence from public,anon,authenticated;
revoke all on public.sparks_checklist_audit from public,anon,authenticated;
grant all on public.sparks_checklist_executions to service_role;
grant all on public.sparks_checklist_execution_items to service_role;
grant all on public.sparks_checklist_item_evidence to service_role;
grant all on public.sparks_checklist_audit to service_role;

-- Follow-up governed RPC must enforce:
-- * active module permission, membership, tenant and target existence;
-- * published template version and module ownership;
-- * template_item_id belongs to the execution's template_version_id;
-- * evidence_asset_id belongs to the execution's organization;
-- * idempotency key matches the command fingerprint;
-- * audited state transitions and immutable published templates.
commit;
