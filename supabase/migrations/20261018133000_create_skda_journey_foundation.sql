-- SK-DA: native journey storage, not deployed. Organization/initiative validated in RPC.
begin;
create table if not exists public.skda_journeys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid not null references public.sparks_initiatives(id) on delete restrict,
  instrument_id uuid not null,
  assessment_cycle_id uuid not null,
  journey_kind text not null,
  status text not null default 'preparation',
  consultant_user_id uuid not null references public.profiles(id) on delete restrict,
  organization_representative_user_id uuid references public.profiles(id) on delete restrict,
  representative_is_provisional boolean not null default true,
  idempotency_key text not null,
  command_fingerprint text not null,
  checklist_execution_id uuid references public.sparks_checklist_executions(id) on delete set null,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint skda_journey_kind_check check (journey_kind in ('assisted_diagnosis','self_assessment','improvement_plan','monitoring')),
  constraint skda_journey_status_check check (status in ('draft','preparation','in_progress','validation','completed','cancelled')),
  constraint skda_journey_idempotency_key_check check (length(trim(idempotency_key)) between 1 and 160),
  constraint skda_journey_fingerprint_check check (length(trim(command_fingerprint)) > 0),
  constraint skda_journey_unique_key unique (organization_id,idempotency_key),
  constraint skda_journey_unique_initiative unique (initiative_id)
);
create index if not exists idx_skda_journeys_org_cycle on public.skda_journeys(organization_id,assessment_cycle_id);
create table if not exists public.skda_journey_audit (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.skda_journeys(id) on delete cascade,
  action text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  before_state jsonb,
  after_state jsonb,
  change_reason text not null,
  created_at timestamptz not null default timezone('utc',now()),
  constraint skda_journey_audit_reason_check check (length(trim(change_reason)) >= 10)
);
alter table public.skda_journeys enable row level security;
alter table public.skda_journey_audit enable row level security;
revoke all on public.skda_journeys,public.skda_journey_audit from public,anon,authenticated;
grant all on public.skda_journeys,public.skda_journey_audit to service_role;
commit;
