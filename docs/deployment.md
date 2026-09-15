# Deployment

Current state of the demo deployment, and the steps left to finish it.

## What is deployed

| Piece | State |
|---|---|
| GitHub | [`ismailir10/crm-batubara`](https://github.com/ismailir10/crm-batubara) — **public** |
| Vercel project | `crm-batubara`, linked to the repo, auto-deploys on push to `main` |
| Build | Passing. All 17 routes compile; `/presentation` is static |
| Working URL | `https://crm-batubara-ismails-projects-196d40d3.vercel.app` |
| Database | **Not provisioned** |

### `crm-batubara.vercel.app` does not serve this project

The deployment metadata lists it as an alias with `aliasError: null`, but the
hostname returns `NOT_FOUND` from Vercel's edge while all three project-scoped
aliases return normally. `*.vercel.app` short names are globally unique; this one
is not bound here. Use the project-scoped URL above, or attach a real domain.

## Remaining steps

These need Vercel dashboard access. The MCP connection used during setup is
read-only for project settings — attempting to change them returns
`403 forbidden`.

### 1. Turn off Vercel Authentication

Project → Settings → Deployment Protection → **Vercel Authentication: Disabled**.

Until this is off, every `*.vercel.app` URL 302-redirects to Vercel SSO and
nobody outside the account can open the demo.

> The deployment serves only synthetic data, but note the login page prints the
> demo credentials and the repository is public. Anyone with the link will be
> able to sign in and browse. That is acceptable for this demo; it is a
> deliberate choice, not an oversight.

### 2. Provision Postgres

Any Postgres 16+ works. There is **no Supabase client library in this codebase** —
data access is `pg` behind a repository layer (decision D-013), so the provider
is a connection string and nothing more.

> **The single detail that matters:** the application must connect as a role that
> does **not** own the tables and is **not** a superuser. Owners and superusers
> bypass row level security, which would silently disable the approval-authority
> enforcement while appearing to work. `npm run db:bootstrap` creates a suitable
> `crm_app` role and now refuses to continue if that role has `SUPERUSER` or
> `BYPASSRLS`.

### 3. Run migrations and seed

With the provider's owner connection string in `ADMIN_DATABASE_URL` and the
application role in `DATABASE_URL`:

```bash
REMOTE_DB=yes npm run db:bootstrap   # create crm_app, grant, verify non-superuser
npm run db:migrate                   # apply db/migrations/*.sql
npm run db:seed                      # deterministic synthetic data
```

`db:bootstrap` detects a non-local host automatically and skips `CREATE DATABASE`,
since hosted providers create the database for you and rarely grant that right.

### 4. Set Vercel environment variables

Project → Settings → Environment Variables, for **Production**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | The `crm_app` connection string. Use the provider's **pooled** endpoint — Vercel functions are short-lived and some providers are IPv6-only on the direct endpoint |
| `SESSION_SECRET` | Generate with the command below and paste it straight into Vercel |
| `DEMO_PASSWORD` | Password for the seeded demo accounts, e.g. `demo1234` |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate `SESSION_SECRET` yourself and paste it directly into the dashboard — it
should not travel through a chat transcript or a commit.

Redeploy after setting them: Vercel does not re-run a build when environment
variables change.

## Verifying a finished deployment

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<url>/presentation   # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<url>/masuk          # 200
```

Then sign in as `hendra.wijaya@demo-batubara.co.id` and confirm the dashboard
KPIs are populated and the coal price page shows eight days across four sources.

## Rollback

- **Application:** Vercel → Deployments → previous deployment → Promote. Instant.
- **Database:** migrations are forward-only. Because all data is synthetic,
  `npm run db:seed` restores the exact demo state at any time — the seed is
  deterministic (see the README).
