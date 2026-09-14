# Product Specification — CRM Batubara (Prototype)

**Version:** 1.1 — reconciled with the implementation
**Date:** 2026-09-14
**Status:** Implemented and locally verified. Not deployed.

**Changes since 1.0**, all logged in `docs/decisions.md`:

- Local database is plain PostgreSQL 16 rather than the Supabase CLI stack, and
  authentication is a signed session cookie rather than Supabase Auth (D-013, D-014). The
  *intent* of D-002 is unchanged: approval authority is still enforced at the data layer by
  RLS, and `tests/integration.test.ts` proves it by connecting as the non-superuser
  application role. There is no Supabase client library in the codebase.
- Visual design language is Stripe Dashboard (D-017); §17 updated.
- Open questions Q-1 through Q-6 resolved (D-015, D-016).
- Five defects found during verification changed behaviour; see D-018. The one that affects
  this document is the period-comparison direction in §13: the delta is `A − B` with the
  percentage relative to B, and the UI must state the direction in words.

Every item is labelled:

| Label | Meaning |
|---|---|
| **[C]** | Confirmed requirement — from the MoM, the project brief, or an approved decision |
| **[R]** | Recommendation — my proposal, open to rejection |
| **[A]** | Assumption — safe, reversible, documented, not confirmed |
| **[Q]** | Open question — needs an answer, has a working default |
| **[P]** | Deferred production requirement — out of prototype scope, in the honest architecture story |

---

## 1. Product objective

**[C]** Demonstrate a single connected commercial workflow for a coal trading business —
`Prospek → Opportunity → Sales Approval → Kontrak → Delivery Order` — with a **Coal Price
Intelligence** module that removes the current dependency on searching old emails for
historical price data.

**[C]** The deliverable is a **demonstration prototype** used to win a management decision,
not a production system. It must be believable end-to-end and honest about its boundaries.

**[R]** Secondary objective: prove that a local vendor can deliver a CRM that fits this
business faster and cheaper than Salesforce, without the concerns raised about Odoo and
without the gaps found in EspoCRM.

## 2. Target users and audience

**Demo audience [C]**
- H. Isam / senior management — decides. Cares about visibility and price intelligence.
- Pak Yudi (Aspri) — introduced the opportunity, coordinates domain and routing.
- Marketing team — the people whose daily work this replaces.

**System users [C]** — approximately **9 users total**. Small team, single office,
no multi-tenant requirement, no field-sales mobile requirement.

## 3. Problem statement

**[C]** From the MoM:

1. The existing PHP + MariaDB CRM works, but internal developer capacity is limited, so
   new features and enhancements arrive slowly.
2. Market alternatives were rejected: Salesforce too expensive, Odoo blocked on a
   China-origin perception concern, EspoCRM has no Indonesian support and limited standard
   features. A suitable local product is preferred.
3. **No coal price index module exists.** Four servers (2 Singapore, 2 China) expose open
   APIs, but the data currently arrives as a **daily email**. Answering "how does today's
   price compare with three years ago?" means opening old emails one by one. There is no
   centralised historical view.
4. Management wants one integrated dashboard across sales, contracts, and delivery orders.

**[C]** The price problem is the sharpest pain and the clearest differentiator. It gets the
most polish.

## 4. Confirmed requirements

| # | Requirement | Source |
|---|---|---|
| R-01 | Prospect / buyer records with meeting notes | MoM §3A |
| R-02 | Opportunity tracking with status: On Progress, Pending, Close, Drop | MoM §3A |
| R-03 | Sales Approval Form generated from a promising opportunity | MoM §3A |
| R-04 | Approval by senior management before contracting | MoM §3A |
| R-05 | Contract records with status Draft / Signed by One Party / Fully Signed | MoM §3B |
| R-06 | Delivery Orders as children of an umbrella (master) contract | MoM §3C |
| R-07 | Contract carries delivery stages, quantity/tonnage, delivery period | MoM §3C |
| R-08 | One integrated dashboard across all modules | MoM §3D |
| R-09 | Coal price: today + previous 7 days as the primary view | MoM §5 |
| R-10 | Full historical price retention and traceability | MoM §5 |
| R-11 | Comparison against prices from several years earlier | MoM §5 |
| R-12 | Visual price presentation in the dashboard, replacing manual email search | MoM §5 |
| R-13 | ~9 users | MoM §6 |
| R-14 | Data stays internal; on-premise deployment preference | MoM §4, §6 |
| R-15 | Professional Bahasa Indonesia UI | Brief |
| R-16 | HTML presentation deck, 16:9, keyboard nav, fullscreen, print/PDF | Brief |
| R-17 | Planned vs delivered quantity must be understandable | Brief |
| R-18 | Source and timestamp traceability per price observation | Brief |

## 5. Prototype scope

**[C]** Eight modules:

1. Executive dashboard
2. Prospects
3. Opportunities (with status transitions)
4. Meeting notes
5. Sales Approval Forms (submit, approve, reject)
6. Contracts (with delivery stages)
7. Delivery Orders (linked to contracts, planned vs actual)
8. Coal Price Intelligence
9. Lightweight users and roles

**[C]** Plus the presentation deck at `/presentation`.

## 6. Non-goals

Explicitly **not** built, and stated as such in the deck:

- **[C]** Real integration with SAP, MariaDB, the existing PHP CRM, or any email inbox.
- **[C]** Real connection to any coal price provider. Mock adapter only.
- **[C]** Production readiness, on-premise hardening, or a migration of existing data.
- **[R]** Document generation (contract PDFs, printable DO forms) and file attachments.
- **[R]** Digital signature capture. Contract signing is a status change, not an e-signature.
- **[R]** Invoicing, payment tracking, accounts receivable, tax documents.
- **[R]** Inventory, mine production, stockpile, barging logistics beyond DO records.
- **[R]** Email or WhatsApp notifications. Approval is in-app only.
- **[R]** Audit log UI, data export, bulk import, and offline mode.
- **[R]** Mobile-first design. Core pages stay responsive; the design target is desktop.
- **[R]** Multi-currency beyond USD with a fixed labelled IDR display rate.

## 7. User roles

**[C]** Three roles, seeded as demo accounts (D-002).

| Role | Bahasa Indonesia label | Capabilities |
|---|---|---|
| `marketing` | Marketing | Create/edit prospects, opportunities, meeting notes. Change opportunity status. Draft and submit a Sales Approval Form. Read contracts and DOs. Read price intelligence. |
| `sales_manager` | Sales Manager | Everything Marketing can do, plus create and manage contracts, delivery stages, and Delivery Orders. |
| `management` | Manajemen | Read everything. **Sole authority to approve or reject a Sales Approval Form.** Dashboard is the landing page. |

**[R]** Role is enforced at the data layer via RLS policies, not only hidden in the UI —
so the demo survives someone asking "what stops marketing approving their own deal?"

**[A]** No user administration screen in the prototype. Roles are seeded. Adding one is
straightforward but demonstrates nothing about the commercial workflow.

## 8. Main user journeys

**J-1 — Prospect to Delivery Order (the demo spine) [C]**
Marketing records a prospect → logs a meeting note → creates an opportunity → moves it
`On Progress` → submits a Sales Approval Form referencing today's index price → Management
opens the SAF, sees the price context, approves → Sales Manager creates the umbrella
contract with three delivery stages → marks it `Ditandatangani Penuh` → issues Delivery
Orders against stage 1 → records actual loaded tonnage → dashboard shows planned vs
delivered.

**J-2 — Rejection path [C]**
Management rejects a SAF with a reason → the opportunity returns to `Pending` → the reason
is visible on the opportunity timeline. Demonstrates that approval is a real gate.

**J-3 — Price comparison [C]**
Management opens Coal Price Intelligence → sees today + 7 days for four indices → filters a
date range → compares Q1 this year against Q1 three years ago → sees average, min, max,
delta, and an overlay chart → clicks a single observation and sees its source, unit, and
fetch timestamp.

**J-4 — Executive scan [C]**
Management lands on the dashboard → sees pipeline value, approvals waiting, contract status
mix, delivery progress, and index movement in one screen → clicks any figure to reach the
underlying records.

## 9. Functional requirements by module

### 9.1 Executive dashboard **[C]**
- KPI row: total pipeline value (USD, open opportunities), count awaiting approval, fully
  signed contracts, delivered vs planned tonnage (current year, % and absolute).
- Opportunity funnel by status with counts and value.
- Coal price strip: 4 indices, latest price, 7-day change (absolute and %), sparkline.
- Delivery progress: contracts with planned vs delivered bars, worst-performing first.
- Action list: SAFs awaiting approval, contracts stuck at one-party signature.
- **[R]** Every KPI is a link to the filtered underlying list. No dead-end numbers.

### 9.2 Prospects **[C]**
- List with search on company name, filter by status and owner.
- Fields: company name, country, contact person, role, email, phone, source, owner, status, notes.
- Detail page showing related meeting notes and opportunities.
- Create and edit. **[R]** No delete — archive via status, which matches how sales teams work.

### 9.3 Meeting notes **[C]**
- Attached to a prospect, optionally to an opportunity.
- Fields: date, location, attendees (free text), discussion summary, next action, next action date, author.
- Created from the prospect or opportunity detail page. Read-only after creation by anyone
  other than the author. **[R]** — meeting minutes that silently change are worthless.

### 9.4 Opportunities **[C]**
- Fields: title, prospect, coal specification (GAR kcal/kg, TM, ash, sulphur), estimated
  volume (MT), estimated price (USD/MT), computed estimated value, delivery term, expected
  close date, owner, status.
- Status change requires a reason; every change is written to a status history table and
  rendered as a timeline on the detail page.
- Detail page links to meeting notes, the SAF, and the resulting contract.

### 9.5 Sales Approval Form **[C]**
- Generated from an opportunity; one active SAF per opportunity.
- Fields: proposed volume, proposed price (USD/MT), payment term, delivery term, proposed
  contract period, justification.
- **[R] Price context block** — the SAF captures the relevant index code, price, and
  observation date **at submission time**, frozen onto the form. This is the feature that
  ties the differentiator to the workflow: management approves a price against the market
  reference as it stood that day, not as it stands now.
- Submit → status `Menunggu Persetujuan`. Only `management` sees Approve / Reject.
- Approve or Reject requires a decision note; decision, decider, and timestamp are stored.
- Approved SAF unlocks contract creation from the opportunity.

### 9.6 Contracts **[C]**
- Created from an approved SAF. Fields: contract number, buyer (prospect), type (umbrella),
  total volume, price basis, price, currency, period start/end, status.
- **Delivery stages** (R-07): stage number, planned volume, period start, period end, notes.
  Sum of stage volumes is validated against total contract volume.
- Status transitions with recorded signature dates per party.
- Detail page: stages table, linked DOs per stage, planned vs delivered per stage and total.
- **[A]** Contract terms are not editable after `Ditandatangani Penuh` — status and DOs only.

### 9.7 Delivery Orders **[C]**
- Created against a contract and a specific delivery stage.
- Fields: DO number, contract, stage, planned volume, actual loaded volume, laycan start/end,
  loading point, destination, vessel/barge name, status.
- Validation: planned volume across DOs for a stage cannot exceed the stage's planned volume
  **[R]** — with a clear error, since over-allocation is the mistake this module should prevent.
- Actual volume recorded when status becomes `Selesai`.
- Planned vs delivered roll-up at stage, contract, and dashboard level.

### 9.8 Coal Price Intelligence **[C]** — highest polish
- **Primary view:** today + previous 7 days, all four sources, table plus chart.
- **Date range filter:** presets (7d, 30d, 90d, 1Y, 3Y, 5Y, custom).
- **Period comparison:** two arbitrary date ranges, side by side — average, minimum, maximum,
  change absolute and percent, plus an overlay chart aligned by day index.
- **Year comparison:** the same calendar window across selected years.
- **Traceability:** every observation exposes source name, region, provider, unit, currency,
  observation date, and **fetch timestamp** plus the ingestion run that produced it (R-18).
- **Ingestion status panel:** last run per source, row count, success/failure, next scheduled
  run — clearly marked as a mock adapter.
- **Synthetic data marker** on every view (D-004).

## 10. Status models

**Opportunity [C]** — from the MoM.
```
On Progress ─┬─> Pending ──> On Progress
             ├─> Close   (terminal — deal tercapai)
             └─> Drop    (terminal)
Pending ─────┴─> Drop
```
**[Q]** The MoM lists `Close` without saying whether it means *won* or *closed out*.
**Default: `Close` = deal tercapai (won)**, since `Drop` already covers the lost case.
Labelled in the UI as `Close (Deal)` to remove the ambiguity for the audience.

**Sales Approval Form [R]** — the MoM confirms the approval step, not the state names.
```
Draft → Menunggu Persetujuan → Disetujui (terminal)
                             → Ditolak   (terminal)
                             → Perlu Revisi → Draft
```

**Contract [C]** for the first three, **[R]** for the last two.
```
Draft → Ditandatangani Satu Pihak → Ditandatangani Penuh → Selesai
  └────────────────────────────────────────────────────→ Dibatalkan
```

**Delivery Order [R]** — the MoM confirms DOs exist, not their states.
```
Draft → Terjadwal → Dalam Pengiriman → Selesai
  └──────────────────────────────────────→ Dibatalkan
```

**[R]** All transitions are validated server-side by an explicit transition map. Illegal
transitions are rejected with a message, not silently ignored.

## 11. Entities and relationships

```
users ──owns──< prospects ──< meeting_notes >── opportunities
                     │                              │
                     └──────────< opportunities >───┘
                                       │
                                       ├──< opportunity_status_history
                                       │
                                       └──1:1── sales_approval_forms
                                                        │
                                                        └──1:1── contracts
                                                                    │
                                                                    ├──< contract_delivery_stages
                                                                    │            │
                                                                    └──< delivery_orders >┘

coal_price_sources ──< coal_price_observations >── price_ingestion_runs
         │
         └── referenced (frozen snapshot) by sales_approval_forms
```

Cardinality notes:
- A prospect has many opportunities. **[A]**
- An opportunity has at most one active SAF; superseded SAFs are retained. **[R]**
- A contract belongs to one opportunity (umbrella contract). **[C]**
- A delivery order belongs to one contract and one delivery stage. **[C]**
- A price observation is unique per `(source, observation_date)`. **[R]**

## 12. Proposed database schema

Postgres. Abbreviated — full DDL lands in `supabase/migrations/`.

```sql
-- identity
create type user_role as enum ('marketing','sales_manager','management');
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- sales
create type prospect_status as enum ('baru','terkualifikasi','tidak_memenuhi_syarat','tidak_aktif');
create table prospects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                    -- PRS-2026-001
  company_name text not null,
  country text not null,
  contact_person text, contact_role text, contact_email text, contact_phone text,
  source text,                                   -- referral, pameran, inbound
  status prospect_status not null default 'baru',
  owner_id uuid not null references profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type opportunity_status as enum ('on_progress','pending','close','drop');
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                     -- OPP-2026-001
  prospect_id uuid not null references prospects(id),
  title text not null,
  coal_gar_kcal int, coal_tm_pct numeric(5,2),
  coal_ash_pct numeric(5,2), coal_sulphur_pct numeric(5,2),
  estimated_volume_tonnes numeric(14,2) not null check (estimated_volume_tonnes > 0),
  estimated_price_usd_per_tonne numeric(10,2) not null check (estimated_price_usd_per_tonne > 0),
  estimated_value_usd numeric(16,2)
    generated always as (estimated_volume_tonnes * estimated_price_usd_per_tonne) stored,
  delivery_term text not null,                   -- FOB Barge | FOB Vessel | CIF
  expected_close_date date,
  status opportunity_status not null default 'on_progress',
  owner_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table opportunity_status_history (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  from_status opportunity_status, to_status opportunity_status not null,
  reason text not null,
  changed_by uuid not null references profiles(id),
  changed_at timestamptz not null default now()
);

create table meeting_notes (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete set null,
  meeting_date date not null,
  location text, attendees text not null,
  summary text not null, next_action text, next_action_date date,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- approval
create type saf_status as enum ('draft','menunggu_persetujuan','disetujui','ditolak','perlu_revisi');
create table sales_approval_forms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                     -- SAF-2026-001
  opportunity_id uuid not null references opportunities(id),
  proposed_volume_tonnes numeric(14,2) not null,
  proposed_price_usd_per_tonne numeric(10,2) not null,
  payment_term text not null, delivery_term text not null,
  contract_period_start date, contract_period_end date,
  justification text not null,
  -- frozen price context at submission (see §9.5)
  ref_source_code text, ref_price_usd_per_tonne numeric(10,2), ref_observation_date date,
  status saf_status not null default 'draft',
  submitted_by uuid references profiles(id), submitted_at timestamptz,
  decided_by uuid references profiles(id), decided_at timestamptz, decision_note text,
  created_at timestamptz not null default now()
);

-- contracts
create type contract_status as enum
  ('draft','ditandatangani_satu_pihak','ditandatangani_penuh','selesai','dibatalkan');
create table contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text not null unique,          -- CTR/2026/001
  opportunity_id uuid not null references opportunities(id),
  sales_approval_form_id uuid not null references sales_approval_forms(id),
  prospect_id uuid not null references prospects(id),
  title text not null,
  total_volume_tonnes numeric(14,2) not null check (total_volume_tonnes > 0),
  price_usd_per_tonne numeric(10,2) not null,
  price_basis text not null,                     -- fixed | index-linked
  period_start date not null, period_end date not null,
  status contract_status not null default 'draft',
  signed_by_seller_at date, signed_by_buyer_at date,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table contract_delivery_stages (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  stage_no int not null,
  planned_volume_tonnes numeric(14,2) not null check (planned_volume_tonnes > 0),
  period_start date not null, period_end date not null,
  notes text,
  unique (contract_id, stage_no),
  check (period_end >= period_start)
);

create type do_status as enum ('draft','terjadwal','dalam_pengiriman','selesai','dibatalkan');
create table delivery_orders (
  id uuid primary key default gen_random_uuid(),
  do_number text not null unique,                -- DO/2026/0001
  contract_id uuid not null references contracts(id),
  stage_id uuid not null references contract_delivery_stages(id),
  planned_volume_tonnes numeric(14,2) not null check (planned_volume_tonnes > 0),
  actual_volume_tonnes numeric(14,2) check (actual_volume_tonnes >= 0),
  laycan_start date, laycan_end date,
  loading_point text, destination text, vessel_name text,
  status do_status not null default 'draft',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- coal price intelligence
create table coal_price_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                     -- ICI-1 ... ICI-4, NEWC-6000, API5
  name text not null, provider text not null, region text not null,   -- Singapore | China
  spec_label text,                               -- GAR 6500 kcal/kg, dsb.
  unit text not null default 'USD/tonne', currency text not null default 'USD',
  is_mock boolean not null default true,
  is_active boolean not null default true
);

create type ingestion_status as enum ('berhasil','gagal','sebagian');
create table price_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references coal_price_sources(id),
  adapter_name text not null,                    -- MockCoalPriceProvider
  started_at timestamptz not null, finished_at timestamptz,
  status ingestion_status not null,
  rows_ingested int not null default 0, message text
);

create table coal_price_observations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references coal_price_sources(id),
  observation_date date not null,
  price numeric(10,2) not null check (price > 0),
  unit text not null, currency text not null,
  fetched_at timestamptz not null,               -- traceability (R-18)
  ingestion_run_id uuid references price_ingestion_runs(id),
  unique (source_id, observation_date)
);
create index on coal_price_observations (source_id, observation_date desc);
```

**[R]** Row Level Security: all authenticated users may `select` every table — this is one
9-person team, and hiding a prospect from a colleague is not the problem being solved.
Writes are restricted by role, and `update` on `sales_approval_forms.status` to a decided
state is restricted to `management`. Approval authority is enforced in the database.

## 13. Coal price ingestion and comparison design

### Adapter boundary **[C]**
```ts
export interface CoalPriceProvider {
  readonly code: string;              // 'ICI-1'
  readonly providerName: string;
  readonly region: 'Singapore' | 'China';
  fetchRange(from: Date, to: Date): Promise<RawPriceObservation[]>;
}
```
**[C]** The only implementation in the prototype is `MockCoalPriceProvider`, which reads
deterministically seeded synthetic data. Class name, UI badge, and deck all say *mock*.

**[R]** A real provider is added later by writing one class and registering it. Nothing
above the adapter changes. This is the single point of future integration, and the deck
says exactly that.

### Ingestion **[R]**
- An idempotent job upserts on `(source_id, observation_date)` and writes a
  `price_ingestion_runs` row per source per run.
- Re-running never duplicates or corrupts data. Demonstrable live by running it twice.
- Triggered manually from the UI in the prototype. **[P]** Scheduled ingestion, retry with
  backoff, alerting on a failed fetch, and reconciliation against the daily email are
  production concerns.

### Comparison engine **[C]**
Pure functions over observations, unit-tested independently of the database:
- `sevenDayWindow(source, asOf)` — today + previous 7 days.
- `summarise(range)` — count, average, min, max, first, last, change absolute and percent.
- `comparePeriods(a, b)` — both summaries plus deltas, aligned by day index for overlay.
  The delta is **`a - b`**, with the percentage relative to B, so a negative value means
  "period A is below the baseline period". A bare signed number is ambiguous here, so the
  UI states the direction in words alongside it (see D-018).
- `compareYears(window, years[])` — the same calendar window across N years.

**[R]** Missing days (weekends, holidays, failed fetches) are shown as gaps, never
interpolated. An invented price point in a price intelligence tool is the one bug that
would destroy trust in the whole module.

## 14. Integration boundaries

| System | Prototype treatment | Production path |
|---|---|---|
| Coal price APIs (2 SG, 2 CN) | **[C]** `CoalPriceProvider` interface, mock implementation, synthetic data | **[P]** Real adapter per provider; outbound-only fetch from inside the network; credentials in internal secret storage |
| SAP | **[C]** Not connected. Named as a boundary in the deck | **[P]** Discovery required: which objects, which direction, which interface (BAPI / OData / file) |
| MariaDB (existing CRM) | **[C]** Not connected | **[P]** Schema discovery, field mapping, one-time migration plus cutover plan |
| Existing PHP CRM | **[C]** Not connected | **[P]** Decide replace vs coexist. Not a technical question — a business one |
| Daily price email | **[C]** Not parsed | **[P]** Optional fallback ingestion if an API proves unreliable |

**[C]** Nothing above is simulated in a way that could be mistaken for a working connection.

## 15. Security and privacy

**Prototype [C]**
- Email + password against the `users` table, scrypt hashing, HMAC-signed httpOnly session
  cookie (D-014). No third-party auth dependency.
- RLS enabled on every table, driven by `app.user_id` set per request inside a transaction.
  The application connects as `crm_app`, a non-superuser role, so the policies actually bind.
- Approval authority enforced in policy, not only in the UI. Write refusals raise an error
  rather than silently matching zero rows (D-018).
- All input validated with Zod at the server boundary; parameterised queries only.
- No secrets in the repository. `.env.example` carries placeholders only.
- 100% synthetic data. No name, buyer, price, or contract from the meeting or real life.
- Demo credentials are printed in the README for the demo, and are worthless — they guard
  synthetic data on a throwaway project.

**Production [P]** — stated in the deck, not built:
- Internal authentication (LDAP / Active Directory / internal SSO) replacing Supabase Auth.
- Network isolation; no inbound access from the public internet.
- Audit logging of every read and write on commercial data.
- Backup, restore testing, retention policy, and monitoring.
- Role and permission review process; leaver/joiner handling.
- Outbound egress control for the four price APIs — allowlist by host, no other egress.

## 16. Demo cloud vs production / on-premise

| Dimension | Demo (now) **[C]** | Production (proposed) **[P]** |
|---|---|---|
| App hosting | Local; Vercel if approved | Internal server — Next.js standalone (`output: "standalone"` is already set), or Docker |
| Database | Local PostgreSQL 16; Supabase Postgres as a plain connection string if approved | Postgres on an internal server |
| Auth | Signed session cookie over a local `users` table | Internal SSO / Active Directory |
| Data | 100% synthetic | Real commercial data, never leaving the internal network |
| Price ingestion | Mock adapter | Real adapters, outbound-only, allowlisted |
| Network | Public URL | Private network, no inbound exposure |
| Backup | None | Scheduled, tested restores |
| Audit | None | Full audit trail |

**[C]** Portability is real — plain Postgres, no proprietary database features, all data
access behind a repository layer, no vendor client calls inside components. **Portability is
not readiness.** The deck says so in those words. Claiming otherwise to this client, whose
stated preference is explicitly against public cloud, would be the fastest way to lose them.

**[C]** Vercel and Supabase are demo infrastructure only, pending explicit approval at the
Phase 5 gate.

## 17. UX direction

**[C]** Professional Bahasa Indonesia throughout. Code and comments in English.

**[C]** Visual language — **Stripe Dashboard** (decision D-017):
- Light blue-grey canvas (`#F6F9FC`), white surfaces lifted by layered low-opacity shadows
  rather than visible borders. Indigo brand accent (`#635BFF`). Light sidebar.
- Type ramp: `#1A1F36` headings, `#3C4257` body, `#697386` muted. 13px base UI text,
  tight negative letter-spacing on headings.
- Semantic colours reserved for status meaning only, never decoration. No gradients, no
  glass effects, no ornament. The amber accent is narrowed to coal-price index context.
- Status uses a consistent pill-badge vocabulary with a status dot — one colour per state,
  used identically everywhere. A viewer should learn it once.
- Dense, scannable tables: no vertical rules, hairline row separators, small uppercase
  column labels, whole-row hover. **Tabular numerals** for all figures, thousands
  separators, consistent decimal places. Money and tonnage right-aligned.
- Desktop-first at 1440px. Core pages remain usable down to tablet width.
- Charts: readable at projector distance — thicker strokes, larger labels, no more than four
  series at once, direct labelling in preference to a legend where it fits.

**[C]** Every screen has meaningful loading, empty, error, and success states. Empty states
explain what to do next rather than saying "no data".

**[C]** No control that appears functional but does nothing. If it is not built, it is not
in the UI.

**[R]** A persistent, unobtrusive `DATA DEMO — SINTETIS` marker in the application chrome,
and a stronger marker on every price figure.

## 18. Presentation deck requirements

**[C]** Route `/presentation`, same design system, Bahasa Indonesia, 16:9.

Mechanics **[C]**: arrow keys and space for previous/next, `F` for fullscreen, `Esc` to exit,
slide counter, print stylesheet producing one slide per page for PDF export, no dependency
on network access during presentation, legible on a low-quality projector.

Narrative **[C]**, ten slides:

| # | Slide | Message |
|---|---|---|
| 1 | Tantangan bisnis saat ini | Coal trading runs on speed; information is scattered |
| 2 | Keterbatasan proses existing | Limited dev capacity, no price module, email archaeology |
| 3 | Solusi: CRM terintegrasi | One system, one flow, built locally |
| 4 | Alur komersial end-to-end | Prospect → Opportunity → Approval → Contract → DO |
| 5 | Coal Price Intelligence | The differentiator. Screenshot-led |
| 6 | Dashboard eksekutif | What management sees in one screen |
| 7 | Integrasi dengan lingkungan existing | SAP, MariaDB, PHP CRM — honest boundaries |
| 8 | Keamanan data & jalur on-premise | Data stays internal. Directly answers the cloud concern |
| 9 | Tahapan implementasi | Phased plan with a clear first milestone |
| 10 | Demo & langkah berikutnya | Transition to the live demo |

**[C]** Seven slides lead with **real screenshots of the running application**, captured by
`npm run deck:capture` and stored in `public/deck/`. Every figure quoted on a slide is read
from the seeded demo database; the only estimated numbers are the email-volume figures on the
"Biaya dari Proses Hari Ini" slide, which are arithmetic on the MoM's own facts (4 sources ×
business days) and are labelled as estimates on the slide itself.

**[C]** Slides 5 and 6 lead with product visuals. **[C]** Every slide distinguishes what is
**working now** from what is **proposed**, using a consistent visual marker. **[R]** Maximum
five bullets per slide; the presenter carries the detail, not the slide.

## 19. Acceptance criteria

The prototype is accepted when all of the following are demonstrated in a browser:

| # | Criterion |
|---|---|
| AC-01 | Log in as each of the three demo roles; the UI and permissions differ appropriately |
| AC-02 | Dashboard renders every KPI with seeded data; each KPI links to its underlying records |
| AC-03 | Create, edit, list, and filter a prospect |
| AC-04 | Add a meeting note to a prospect and see it on the detail page |
| AC-05 | Create an opportunity and see its computed estimated value |
| AC-06 | Change opportunity status with a reason; the change appears in the timeline |
| AC-07 | An illegal status transition is rejected with a clear message |
| AC-08 | Create and submit a Sales Approval Form; the index price context is frozen onto it |
| AC-09 | As Marketing, the approve/reject controls are absent **and** a direct API call is refused |
| AC-10 | As Management, approve a SAF with a note; the opportunity reflects it |
| AC-11 | As Management, reject a different SAF; the opportunity returns to `Pending` with the reason visible |
| AC-12 | Create a contract from an approved SAF with three delivery stages |
| AC-13 | Stage volumes are validated against total contract volume |
| AC-14 | Advance contract status through one-party to fully signed, with signature dates |
| AC-15 | Create Delivery Orders against a stage; over-allocation is rejected with a clear message |
| AC-16 | Complete a DO with an actual volume; planned vs delivered updates at stage, contract, and dashboard |
| AC-17 | Coal price view shows today + previous 7 days for four sources |
| AC-18 | Filter price history by preset and custom date range |
| AC-19 | Compare two arbitrary periods; averages, min, max, and deltas are correct |
| AC-20 | Compare the same calendar window across years, at least 3 years apart |
| AC-21 | Inspect one observation and see source, provider, region, unit, and fetch timestamp |
| AC-22 | Trigger mock ingestion twice; no duplicate rows; both runs appear in the run log |
| AC-23 | Navigate prospect → opportunity → SAF → contract → DO and back, entirely by links |
| AC-24 | Loading, empty, and error states render for the dashboard and price module |
| AC-25 | Deck runs at `/presentation`: keyboard nav, fullscreen, print to PDF, 10 slides |
| AC-26 | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass |
| AC-27 | Re-running the seed from empty reproduces identical data |
| AC-28 | No material console errors during the full journey |

## 20. Test strategy

**[C]** Proportionate — test the logic that would embarrass us if wrong.

**Unit (Vitest) [C]**
- Status transition maps for all four status models, including every illegal transition.
- Planned vs delivered arithmetic, including partial stages and cancelled DOs.
- Stage volume and DO over-allocation validation.
- Price comparison functions: `summarise`, `comparePeriods`, `compareYears`, including
  empty ranges, single-day ranges, and gaps.
- Deterministic seed: same seed produces identical output.
- Zod schemas: boundary and rejection cases.

**Integration [R]**
- Repository layer against a real local Postgres: RLS behaviour per role, ingestion
  idempotency (run twice, assert row count).

**End-to-end (Playwright) [C]**
- J-1, the full demo spine, as one test. If this passes, the demo works.
- J-2, the rejection path.
- J-3, price comparison including a 3-year comparison.
- Role-based access: Marketing cannot approve, verified at the API, not just the UI.

**Manual [C]** — browser verification of the full journey, console checked, responsive
behaviour at tablet width, deck tested in fullscreen and print preview.

**Not tested [R]**: visual regression, load and performance (9 users), cross-browser beyond
Chromium, accessibility audit. All disclosed rather than quietly skipped.

## 21. Deployment and rollback

**[C]** No external resource is created before explicit approval at the Phase 5 gate.

**Local [C]**: `supabase start` → `supabase db reset` (migrations + seed) → `npm run dev`.
Setup documented in the README and reproducible from a clean checkout.

**Deployment, after approval [C]**:
1. Create the Supabase project; apply migrations; run the seed.
2. Set Vercel environment variables. Never committed, never printed.
3. Deploy; verify `/` and `/presentation`; run the demo journey against the deployed URL.
4. Report the verified URL and state what is working, mocked, deferred, or unverified.

**Rollback [C]**:
- Application: Vercel instant rollback to the previous deployment.
- Database: forward-only migrations; `supabase db reset` restores the deterministic seed
  state exactly — acceptable precisely because all data is synthetic (D-007).
- No destructive operation runs without confirmation.

## 22. Assumptions and open questions

**Assumptions [A]** — proceeding on these; flag any that are wrong:
1. `Close` on an opportunity means the deal was won (§10).
2. No user administration UI is needed for the demo (§7).
3. Contract terms become immutable once fully signed; only status and DOs change (§9.6).
4. One umbrella contract per opportunity (§11).
5. Nine users means a single team with shared visibility — no per-user record hiding (§12).
6. No demo date, so full scope is built without reduction (D-009).
7. Coal specs (GAR/TM/ash/sulphur) are the right technical attributes for an opportunity —
   standard for Indonesian thermal coal, but confirm with the client's actual form.

**Open questions [Q]** — with working defaults, none blocking:
1. **Demo date?** Default: no deadline, full scope. *Changes scope if tight.*
2. **`Close` semantics** — won, or closed-out? Default: won.
3. **Does the client's real Sales Approval Form have required fields we are missing?**
   Default: the fields in §9.5. *Worth asking Pak Yudi before the presentation — matching
   their actual form would be a strong credibility signal.*
4. **Are the four indices thermal coal only, and at which calorific specs?** Default: a
   realistic mix across GAR 4200–6500. *Affects seed realism only.*
5. **Should the deck include indicative pricing or a commercial proposal?** Default: no —
   technical and operational value only, with commercials handled separately.
6. **Seller entity name for contracts in the demo data?** Default: a neutral placeholder,
   `PT Demo Batubara Nusantara`, clearly fictional.

---

## Summary of the main decisions

1. **Scope is the spine, not the breadth** — one connected flow built deeply, with clearly
   declared non-goals, rather than a shallow imitation of an enterprise CRM.
2. **The Sales Approval Form freezes the index price at submission.** This is the design
   choice that makes Coal Price Intelligence part of the workflow instead of a separate
   chart page — management approves a price against the market reference of that day.
3. **Approval authority is enforced in the database**, so the access-control question
   survives being asked live.
4. **Price gaps are never interpolated.** Fabricated data points in a price tool would
   destroy the module's credibility.
5. **The mock boundary is a single interface**, so the future-integration story is one
   concrete class, not hand-waving.
6. **The cloud concern is answered head-on** in slide 8 and §16, including the outbound-only
   framing for the two China-hosted sources (D-012).
7. **Portability is stated, readiness is not claimed.**
