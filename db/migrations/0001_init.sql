-- 0001_init.sql — CRM Batubara prototype schema
-- Target: PostgreSQL 16+. No vendor-specific extensions beyond pgcrypto for gen_random_uuid.
-- Run with the ADMIN connection (table owner). The application connects as crm_app,
-- a non-superuser role, so RLS policies below are actually enforced.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('marketing','sales_manager','management');
exception when duplicate_object then null; end $$;

do $$ begin
  create type prospect_status as enum ('baru','terkualifikasi','tidak_memenuhi_syarat','tidak_aktif');
exception when duplicate_object then null; end $$;

do $$ begin
  create type opportunity_status as enum ('on_progress','pending','close','drop');
exception when duplicate_object then null; end $$;

do $$ begin
  create type saf_status as enum ('draft','menunggu_persetujuan','disetujui','ditolak','perlu_revisi');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contract_status as enum
    ('draft','ditandatangani_satu_pihak','ditandatangani_penuh','selesai','dibatalkan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type do_status as enum ('draft','terjadwal','dalam_pengiriman','selesai','dibatalkan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ingestion_status as enum ('berhasil','gagal','sebagian');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Session helpers. The app sets app.user_id per request inside a transaction.
-- ---------------------------------------------------------------------------
create or replace function app_user_id() returns uuid
  language sql stable
as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

create or replace function set_updated_at() returns trigger
  language plpgsql
as $$ begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  full_name     text not null,
  job_title     text,
  role          user_role not null,
  password_hash text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Defined after users, since the function body is validated at creation time.
-- security definer: reading users from inside a policy on users would recurse.
create or replace function app_user_role() returns text
  language sql stable security definer set search_path = public
as $$ select role::text from users where id = app_user_id() and is_active $$;

-- ---------------------------------------------------------------------------
-- Sales
-- ---------------------------------------------------------------------------
create sequence if not exists prospect_code_seq;
create table if not exists prospects (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique
                   default 'PRS-' || to_char(now(),'YYYY') || '-'
                        || lpad(nextval('prospect_code_seq')::text, 3, '0'),
  company_name   text not null,
  country        text not null,
  city           text,
  contact_person text,
  contact_role   text,
  contact_email  text,
  contact_phone  text,
  source         text,
  status         prospect_status not null default 'baru',
  owner_id       uuid not null references users(id),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists prospects_status_idx on prospects (status);
create index if not exists prospects_owner_idx on prospects (owner_id);

create sequence if not exists opportunity_code_seq;
create table if not exists opportunities (
  id                            uuid primary key default gen_random_uuid(),
  code                          text not null unique
                                  default 'OPP-' || to_char(now(),'YYYY') || '-'
                                       || lpad(nextval('opportunity_code_seq')::text, 3, '0'),
  prospect_id                   uuid not null references prospects(id) on delete restrict,
  title                         text not null,
  coal_gar_kcal                 int,
  coal_tm_pct                   numeric(5,2),
  coal_ash_pct                  numeric(5,2),
  coal_sulphur_pct              numeric(5,2),
  estimated_volume_tonnes       numeric(14,2) not null check (estimated_volume_tonnes > 0),
  estimated_price_usd_per_tonne numeric(10,2) not null check (estimated_price_usd_per_tonne > 0),
  estimated_value_usd           numeric(18,2)
    generated always as (estimated_volume_tonnes * estimated_price_usd_per_tonne) stored,
  delivery_term                 text not null,
  expected_close_date           date,
  status                        opportunity_status not null default 'on_progress',
  owner_id                      uuid not null references users(id),
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);
create index if not exists opportunities_status_idx on opportunities (status);
create index if not exists opportunities_prospect_idx on opportunities (prospect_id);

create table if not exists opportunity_status_history (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  from_status    opportunity_status,
  to_status      opportunity_status not null,
  reason         text not null,
  changed_by     uuid not null references users(id),
  changed_at     timestamptz not null default now()
);
create index if not exists osh_opportunity_idx on opportunity_status_history (opportunity_id, changed_at desc);

create table if not exists meeting_notes (
  id               uuid primary key default gen_random_uuid(),
  prospect_id      uuid not null references prospects(id) on delete cascade,
  opportunity_id   uuid references opportunities(id) on delete set null,
  meeting_date     date not null,
  location         text,
  attendees        text not null,
  summary          text not null,
  next_action      text,
  next_action_date date,
  created_by       uuid not null references users(id),
  created_at       timestamptz not null default now()
);
create index if not exists meeting_notes_prospect_idx on meeting_notes (prospect_id, meeting_date desc);

-- ---------------------------------------------------------------------------
-- Sales Approval Form
-- ---------------------------------------------------------------------------
create sequence if not exists saf_code_seq;
create table if not exists sales_approval_forms (
  id                            uuid primary key default gen_random_uuid(),
  code                          text not null unique
                                  default 'SAF-' || to_char(now(),'YYYY') || '-'
                                       || lpad(nextval('saf_code_seq')::text, 3, '0'),
  opportunity_id                uuid not null references opportunities(id) on delete restrict,
  proposed_volume_tonnes        numeric(14,2) not null check (proposed_volume_tonnes > 0),
  proposed_price_usd_per_tonne  numeric(10,2) not null check (proposed_price_usd_per_tonne > 0),
  proposed_value_usd            numeric(18,2)
    generated always as (proposed_volume_tonnes * proposed_price_usd_per_tonne) stored,
  payment_term                  text not null,
  delivery_term                 text not null,
  contract_period_start         date,
  contract_period_end           date,
  justification                 text not null,
  -- Frozen market reference captured at submission time (specification §9.5).
  ref_source_code               text,
  ref_source_name               text,
  ref_price_usd_per_tonne       numeric(10,2),
  ref_observation_date          date,
  status                        saf_status not null default 'draft',
  submitted_by                  uuid references users(id),
  submitted_at                  timestamptz,
  decided_by                    uuid references users(id),
  decided_at                    timestamptz,
  decision_note                 text,
  created_by                    uuid not null references users(id),
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);
create index if not exists saf_status_idx on sales_approval_forms (status);
create index if not exists saf_opportunity_idx on sales_approval_forms (opportunity_id);

-- ---------------------------------------------------------------------------
-- Contracts
-- ---------------------------------------------------------------------------
create sequence if not exists contract_code_seq;
create table if not exists contracts (
  id                     uuid primary key default gen_random_uuid(),
  contract_number        text not null unique
                           default 'CTR/' || to_char(now(),'YYYY') || '/'
                                || lpad(nextval('contract_code_seq')::text, 3, '0'),
  opportunity_id         uuid not null references opportunities(id) on delete restrict,
  sales_approval_form_id uuid not null references sales_approval_forms(id) on delete restrict,
  prospect_id            uuid not null references prospects(id) on delete restrict,
  title                  text not null,
  total_volume_tonnes    numeric(14,2) not null check (total_volume_tonnes > 0),
  price_usd_per_tonne    numeric(10,2) not null check (price_usd_per_tonne > 0),
  price_basis            text not null,
  currency               text not null default 'USD',
  period_start           date not null,
  period_end             date not null,
  status                 contract_status not null default 'draft',
  signed_by_seller_at    date,
  signed_by_buyer_at     date,
  created_by             uuid not null references users(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (period_end >= period_start)
);
create index if not exists contracts_status_idx on contracts (status);

create table if not exists contract_delivery_stages (
  id                     uuid primary key default gen_random_uuid(),
  contract_id            uuid not null references contracts(id) on delete cascade,
  stage_no               int not null,
  planned_volume_tonnes  numeric(14,2) not null check (planned_volume_tonnes > 0),
  period_start           date not null,
  period_end             date not null,
  notes                  text,
  unique (contract_id, stage_no),
  check (period_end >= period_start)
);
create index if not exists stages_contract_idx on contract_delivery_stages (contract_id, stage_no);

create sequence if not exists do_code_seq;
create table if not exists delivery_orders (
  id                    uuid primary key default gen_random_uuid(),
  do_number             text not null unique
                          default 'DO/' || to_char(now(),'YYYY') || '/'
                               || lpad(nextval('do_code_seq')::text, 4, '0'),
  contract_id           uuid not null references contracts(id) on delete restrict,
  stage_id              uuid not null references contract_delivery_stages(id) on delete restrict,
  planned_volume_tonnes numeric(14,2) not null check (planned_volume_tonnes > 0),
  actual_volume_tonnes  numeric(14,2) check (actual_volume_tonnes >= 0),
  laycan_start          date,
  laycan_end            date,
  loading_point         text,
  destination           text,
  vessel_name           text,
  status                do_status not null default 'draft',
  created_by            uuid not null references users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists do_contract_idx on delivery_orders (contract_id);
create index if not exists do_stage_idx on delivery_orders (stage_id);
create index if not exists do_status_idx on delivery_orders (status);

-- ---------------------------------------------------------------------------
-- Coal Price Intelligence
-- ---------------------------------------------------------------------------
create table if not exists coal_price_sources (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  provider   text not null,
  region     text not null,
  spec_label text,
  unit       text not null default 'USD/tonne',
  currency   text not null default 'USD',
  is_mock    boolean not null default true,
  is_active  boolean not null default true,
  sort_order int not null default 0
);

create table if not exists price_ingestion_runs (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references coal_price_sources(id) on delete cascade,
  adapter_name  text not null,
  started_at    timestamptz not null,
  finished_at   timestamptz,
  status        ingestion_status not null,
  rows_ingested int not null default 0,
  message       text
);
create index if not exists runs_source_idx on price_ingestion_runs (source_id, started_at desc);

create table if not exists coal_price_observations (
  id               uuid primary key default gen_random_uuid(),
  source_id        uuid not null references coal_price_sources(id) on delete cascade,
  observation_date date not null,
  price            numeric(10,2) not null check (price > 0),
  unit             text not null,
  currency         text not null,
  fetched_at       timestamptz not null,
  ingestion_run_id uuid references price_ingestion_runs(id) on delete set null,
  unique (source_id, observation_date)
);
create index if not exists observations_source_date_idx
  on coal_price_observations (source_id, observation_date desc);
create index if not exists observations_date_idx
  on coal_price_observations (observation_date desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['prospects','opportunities','sales_approval_forms','contracts','delivery_orders']
  loop
    execute format('drop trigger if exists %I_set_updated_at on %I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Read: any authenticated user sees everything. This is one nine-person team;
-- hiding a prospect from a colleague is not the problem being solved.
-- Write: restricted by role. Approval authority is enforced here, in the database,
-- not merely by hiding a button.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users','prospects','opportunities','opportunity_status_history','meeting_notes',
    'sales_approval_forms','contracts','contract_delivery_stages','delivery_orders',
    'coal_price_sources','price_ingestion_runs','coal_price_observations']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Read policies: authenticated only.
do $$
declare t text;
begin
  foreach t in array array[
    'users','prospects','opportunities','opportunity_status_history','meeting_notes',
    'sales_approval_forms','contracts','contract_delivery_stages','delivery_orders',
    'coal_price_sources','price_ingestion_runs','coal_price_observations']
  loop
    execute format('drop policy if exists %I_read on %I', t, t);
    execute format(
      'create policy %I_read on %I for select using (app_user_id() is not null)', t, t);
  end loop;
end $$;

-- Sales-side writes: marketing, sales_manager, management.
do $$
declare t text;
begin
  foreach t in array array['prospects','opportunities','opportunity_status_history','meeting_notes']
  loop
    execute format('drop policy if exists %I_write on %I', t, t);
    execute format(
      'create policy %I_write on %I for all
         using (app_user_role() in (''marketing'',''sales_manager'',''management''))
         with check (app_user_role() in (''marketing'',''sales_manager'',''management''))', t, t);
  end loop;
end $$;

-- Contracts, stages, delivery orders: sales_manager and management only.
do $$
declare t text;
begin
  foreach t in array array['contracts','contract_delivery_stages','delivery_orders']
  loop
    execute format('drop policy if exists %I_write on %I', t, t);
    execute format(
      'create policy %I_write on %I for all
         using (app_user_role() in (''sales_manager'',''management''))
         with check (app_user_role() in (''sales_manager'',''management''))', t, t);
  end loop;
end $$;

-- Sales Approval Forms.
-- Anyone in sales may create and edit a form while it is undecided.
drop policy if exists saf_insert on sales_approval_forms;
create policy saf_insert on sales_approval_forms for insert
  with check (app_user_role() in ('marketing','sales_manager','management'));

-- The approval gate. Moving a form into a decided state requires the management role,
-- and a decided form cannot be edited by anyone else afterwards.
drop policy if exists saf_update on sales_approval_forms;
create policy saf_update on sales_approval_forms for update
  using (
    app_user_role() in ('marketing','sales_manager','management')
    and (status not in ('disetujui','ditolak') or app_user_role() = 'management')
  )
  with check (
    case
      when status in ('disetujui','ditolak') then app_user_role() = 'management'
      else app_user_role() in ('marketing','sales_manager','management')
    end
  );

-- Price ingestion is written by the ingestion job, which runs as an authenticated user.
do $$
declare t text;
begin
  foreach t in array array['coal_price_sources','price_ingestion_runs','coal_price_observations']
  loop
    execute format('drop policy if exists %I_write on %I', t, t);
    execute format(
      'create policy %I_write on %I for all
         using (app_user_id() is not null) with check (app_user_id() is not null)', t, t);
  end loop;
end $$;

-- users: readable by all authenticated users, writable by nobody through the app.

-- ---------------------------------------------------------------------------
-- Login lookup.
-- Every read policy requires an established session, so authentication itself
-- cannot go through one. This is the single, deliberately narrow exception:
-- it takes an email and returns one row, and is the only way in.
-- ---------------------------------------------------------------------------
create or replace function app_login_lookup(p_email text)
returns table (
  id uuid, email text, full_name text, job_title text,
  role user_role, password_hash text, is_active boolean
)
language sql stable security definer set search_path = public
as $$
  select u.id, u.email, u.full_name, u.job_title, u.role, u.password_hash, u.is_active
  from users u
  where lower(u.email) = lower(p_email)
  limit 1
$$;

-- Loads the session user for an established session.
create or replace function app_session_user(p_user_id uuid)
returns table (
  id uuid, email text, full_name text, job_title text, role user_role, is_active boolean
)
language sql stable security definer set search_path = public
as $$
  select u.id, u.email, u.full_name, u.job_title, u.role, u.is_active
  from users u
  where u.id = p_user_id and u.is_active
  limit 1
$$;

-- ---------------------------------------------------------------------------
-- Grants for the application role. Created by scripts/bootstrap-db.ts.
-- crm_app is NOT the table owner and NOT a superuser, so RLS applies to it.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'crm_app') then
    grant usage on schema public to crm_app;
    grant select, insert, update, delete on all tables in schema public to crm_app;
    grant usage, select on all sequences in schema public to crm_app;
    grant execute on all functions in schema public to crm_app;
    alter default privileges in schema public
      grant select, insert, update, delete on tables to crm_app;
    alter default privileges in schema public
      grant usage, select on sequences to crm_app;
  end if;
end $$;
