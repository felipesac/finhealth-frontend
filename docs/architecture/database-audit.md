# Database Audit - FinHealth Frontend

> Brownfield Discovery Phase 2 - Database Audit
> Generated: 2026-02-08 | Agent: @data-engineer (Dara)

---

## 1. Overview

| Attribute | Value |
|-----------|-------|
| **Engine** | PostgreSQL 17 (Supabase) |
| **Migrations** | 7 sequential SQL files |
| **Tables** | 13 total |
| **RLS** | Enabled on all tables |
| **Indexes** | 52 total |
| **Triggers** | 9 `updated_at` triggers |
| **Functions** | 2 (`update_updated_at`, `is_admin`) |
| **Realtime** | Enabled |

---

## 2. Table Inventory

| # | Table | Migration | Rows (est.) | RLS | updated_at Trigger | FK Relations |
|---|-------|-----------|-------------|-----|-------------------|--------------|
| 1 | `patients` | 001 | Variable | Yes | Yes | None |
| 2 | `health_insurers` | 001 | Variable | Yes | Yes | None |
| 3 | `medical_accounts` | 001 | Variable | Yes | Yes | patients, health_insurers |
| 4 | `procedures` | 001 | Variable | Yes | No | medical_accounts (CASCADE) |
| 5 | `glosas` | 001 | Variable | Yes | Yes | medical_accounts (CASCADE), procedures |
| 6 | `payments` | 001 | Variable | Yes | No | health_insurers |
| 7 | `notifications` | 001 | Variable | Yes | No | None (user_id not FK) |
| 8 | `tuss_procedures` | 002 | ~75 seeded | Yes | Yes | None |
| 9 | `audit_logs` | 003 | Variable | Yes | No | auth.users |
| 10 | `glosa_notifications` | 004 | Variable | Yes | Yes | medical_accounts (CASCADE) |
| 11 | `digital_certificates` | 005 | Variable | Yes | Yes | None (user_id not FK) |
| 12 | `sus_procedures` | 006 | Variable | Yes | Yes | None |
| 13 | `sus_bpa` | 006 | Variable | Yes | Yes | patients |
| 14 | `sus_aih` | 006 | Variable | Yes | Yes | patients |

---

## 3. Schema Details by Table

### 3.1 patients

```sql
id              UUID PK DEFAULT gen_random_uuid()
external_id     TEXT
name            TEXT NOT NULL
cpf             VARCHAR(14)
birth_date      DATE
gender          VARCHAR(20)
phone           VARCHAR(20)
email           TEXT
address         JSONB DEFAULT '{}'
health_insurance_id TEXT           -- Note: not a FK to health_insurers
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**Indexes:** `idx_patients_name(name)`, `idx_patients_cpf(cpf)`

### 3.2 health_insurers

```sql
id              UUID PK DEFAULT gen_random_uuid()
ans_code        VARCHAR(20) NOT NULL
name            TEXT NOT NULL
cnpj            VARCHAR(18)
tiss_version    VARCHAR(10) DEFAULT '3.05.00'
contact_email   TEXT
api_endpoint    TEXT
config          JSONB DEFAULT '{}'
active          BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**Indexes:** `idx_insurers_name(name)`, `idx_insurers_active(active)`

### 3.3 medical_accounts

```sql
id                      UUID PK DEFAULT gen_random_uuid()
account_number          TEXT NOT NULL
patient_id              UUID FK → patients(id)
health_insurer_id       UUID FK → health_insurers(id)
admission_date          DATE
discharge_date          DATE
account_type            VARCHAR(20) NOT NULL CHECK IN (internacao|ambulatorial|sadt|honorarios)
status                  VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK IN (pending|validated|sent|paid|glosa|appeal)
total_amount            DECIMAL(12,2) DEFAULT 0
approved_amount         DECIMAL(12,2) DEFAULT 0
glosa_amount            DECIMAL(12,2) DEFAULT 0
paid_amount             DECIMAL(12,2) DEFAULT 0
tiss_guide_number       TEXT
tiss_guide_type         TEXT
tiss_xml                TEXT
tiss_validation_status  VARCHAR(20) DEFAULT 'pending' CHECK IN (valid|invalid|pending)
tiss_validation_errors  JSONB DEFAULT '[]'
audit_score             DECIMAL(5,2)
glosa_risk_score        DECIMAL(5,2)
audit_issues            JSONB DEFAULT '[]'
metadata                JSONB DEFAULT '{}'
created_at              TIMESTAMPTZ DEFAULT NOW()
updated_at              TIMESTAMPTZ DEFAULT NOW()
sent_at                 TIMESTAMPTZ
paid_at                 TIMESTAMPTZ
```

**Indexes (6):** `status`, `account_type`, `health_insurer_id`, `patient_id`, `created_at DESC`, `account_number`

### 3.4 procedures

```sql
id                  UUID PK DEFAULT gen_random_uuid()
medical_account_id  UUID NOT NULL FK → medical_accounts(id) ON DELETE CASCADE
tuss_code           VARCHAR(10)
sigtap_code         VARCHAR(10)
cbhpm_code          VARCHAR(10)
description         TEXT NOT NULL
quantity            DECIMAL(10,2) DEFAULT 1
unit_price          DECIMAL(12,2) DEFAULT 0
total_price         DECIMAL(12,2) DEFAULT 0
performed_at        TIMESTAMPTZ
professional_id     TEXT
professional_name   TEXT
professional_council TEXT
status              VARCHAR(20) DEFAULT 'pending'
glosa_code          TEXT
glosa_reason        TEXT
appeal_status       VARCHAR(20)
metadata            JSONB DEFAULT '{}'
created_at          TIMESTAMPTZ DEFAULT NOW()
```

**Indexes:** `idx_procedures_account(medical_account_id)`, `idx_procedures_tuss(tuss_code)`
**Note:** No `updated_at` column or trigger.

### 3.5 glosas

```sql
id                  UUID PK DEFAULT gen_random_uuid()
medical_account_id  UUID NOT NULL FK → medical_accounts(id) ON DELETE CASCADE
procedure_id        UUID FK → procedures(id)
glosa_code          TEXT NOT NULL
glosa_description   TEXT
glosa_type          VARCHAR(20) CHECK IN (administrativa|tecnica|linear)
original_amount     DECIMAL(12,2) DEFAULT 0
glosa_amount        DECIMAL(12,2) DEFAULT 0
appeal_status       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK IN (pending|in_progress|sent|accepted|rejected)
appeal_text         TEXT
appeal_sent_at      TIMESTAMPTZ
appeal_response     TEXT
appeal_resolved_at  TIMESTAMPTZ
ai_recommendation   TEXT
success_probability DECIMAL(5,4)
priority_score      DECIMAL(5,2)
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (4):** `medical_account_id`, `appeal_status`, `priority_score DESC`, `glosa_type`

### 3.6 payments

```sql
id                      UUID PK DEFAULT gen_random_uuid()
health_insurer_id       UUID FK → health_insurers(id)
payment_date            DATE NOT NULL
payment_reference       TEXT
bank_account            TEXT
total_amount            DECIMAL(12,2) DEFAULT 0
matched_amount          DECIMAL(12,2) DEFAULT 0
unmatched_amount        DECIMAL(12,2) DEFAULT 0
reconciliation_status   VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK IN (pending|partial|matched)
reconciled_at           TIMESTAMPTZ
payment_file_url        TEXT
payment_file_type       TEXT
metadata                JSONB DEFAULT '{}'
created_at              TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (3):** `health_insurer_id`, `payment_date DESC`, `reconciliation_status`
**Note:** No `updated_at` column or trigger.

### 3.7 notifications

```sql
id          UUID PK DEFAULT gen_random_uuid()
user_id     UUID NOT NULL              -- Not a FK!
title       TEXT NOT NULL
message     TEXT
type        VARCHAR(20) DEFAULT 'info' CHECK IN (info|warning|error|success)
read        BOOLEAN DEFAULT false
href        TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (3):** `user_id`, `(user_id, read)`, `created_at DESC`

### 3.8 tuss_procedures

```sql
id              UUID PK DEFAULT gen_random_uuid()
code            VARCHAR(10) NOT NULL UNIQUE
description     TEXT NOT NULL
chapter         VARCHAR(100)
group_name      VARCHAR(100)
subgroup        VARCHAR(100)
procedure_type  VARCHAR(50)         -- consulta|exame|procedimento|terapia|cirurgia
unit_price      DECIMAL(10,2) DEFAULT 0
aux_price       DECIMAL(10,2) DEFAULT 0
film_price      DECIMAL(10,2) DEFAULT 0
uco             DECIMAL(6,2) DEFAULT 1
active          BOOLEAN DEFAULT true
ans_update_date DATE
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (4):** `code`, GIN full-text on `description` (Portuguese), `chapter`, `procedure_type`
**Seed data:** 75 common Brazilian medical procedures.

### 3.9 audit_logs

```sql
id          UUID PK DEFAULT gen_random_uuid()
user_id     UUID NOT NULL FK → auth.users(id)
action      TEXT NOT NULL
resource    TEXT NOT NULL
resource_id UUID
details     JSONB DEFAULT '{}'
ip          TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (3):** `user_id`, `(resource, resource_id)`, `created_at DESC`

### 3.10 glosa_notifications

```sql
id                  UUID PK DEFAULT gen_random_uuid()
medical_account_id  UUID FK → medical_accounts(id) ON DELETE CASCADE
severity            VARCHAR(20) NOT NULL CHECK IN (CRITICO|ALTO|MEDIO)
risk_score          DECIMAL(5,2) NOT NULL
potential_amount    DECIMAL(12,2) DEFAULT 0
notification_data   JSONB DEFAULT '{}'
status              VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK IN (pending|sent|read|dismissed)
sent_at             TIMESTAMPTZ
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (4):** `medical_account_id`, `severity`, `status`, `created_at DESC`

### 3.11 digital_certificates

```sql
id                UUID PK DEFAULT gen_random_uuid()
user_id           UUID NOT NULL              -- Not a FK!
name              TEXT NOT NULL
common_name       TEXT NOT NULL
serial_number     TEXT NOT NULL
issuer            TEXT NOT NULL
subject           TEXT NOT NULL
valid_from        TIMESTAMPTZ NOT NULL
valid_to          TIMESTAMPTZ NOT NULL
cnpj              VARCHAR(14)
cpf               VARCHAR(11)
certificate_type  VARCHAR(10) NOT NULL DEFAULT 'A1' CHECK IN ('A1')
status            VARCHAR(20) NOT NULL DEFAULT 'active' CHECK IN (active|expired|revoked|replaced)
pfx_data          BYTEA NOT NULL
file_name         TEXT NOT NULL
file_size         INTEGER NOT NULL
fingerprint       TEXT NOT NULL
metadata          JSONB DEFAULT '{}'
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (5):** `UNIQUE(user_id) WHERE status='active'`, `user_id`, `status`, `valid_to`, `cnpj`, `fingerprint`

### 3.12 sus_procedures (SIGTAP)

```sql
id                          UUID PK DEFAULT gen_random_uuid()
codigo_sigtap               VARCHAR(20) NOT NULL
nome                        TEXT NOT NULL
competencia                 VARCHAR(7) NOT NULL         -- YYYY-MM
valor_ambulatorial          NUMERIC(12,2) DEFAULT 0
valor_hospitalar            NUMERIC(12,2) DEFAULT 0
complexidade                VARCHAR(20)
modalidade                  VARCHAR(30)
grupo                       VARCHAR(100)                -- Added in 007
subgrupo                    VARCHAR(150)                -- Added in 007
forma_organizacao           VARCHAR(150)                -- Added in 007
tipo                        VARCHAR(30)                 -- Added in 007
codigo_grupo                VARCHAR(2)                  -- Added in 007
codigo_subgrupo             VARCHAR(2)                  -- Added in 007
codigo_forma_organizacao    VARCHAR(2)                  -- Added in 007
created_at                  TIMESTAMPTZ DEFAULT NOW()
updated_at                  TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (5):** `UNIQUE(codigo_sigtap, competencia)`, GIN full-text on `nome` (Portuguese), `codigo_grupo`, `tipo`, `complexidade`

### 3.13 sus_bpa

```sql
id              UUID PK DEFAULT gen_random_uuid()
user_id         UUID NOT NULL              -- Not a FK!
cnes            VARCHAR(7) NOT NULL
competencia     VARCHAR(7) NOT NULL
cbo             VARCHAR(6) NOT NULL
procedimento    VARCHAR(20) NOT NULL
quantidade      INTEGER NOT NULL DEFAULT 1
cnpj_prestador  VARCHAR(14)
patient_id      UUID FK → patients(id)
valor_unitario  NUMERIC(12,2) DEFAULT 0
valor_total     NUMERIC(12,2) DEFAULT 0
status          VARCHAR(20) DEFAULT 'rascunho'
metadata        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (5):** `user_id`, `competencia`, `cnes`, `status`, `created_at DESC`

### 3.14 sus_aih

```sql
id                          UUID PK DEFAULT gen_random_uuid()
user_id                     UUID NOT NULL              -- Not a FK!
numero_aih                  VARCHAR(13) NOT NULL UNIQUE
patient_id                  UUID FK → patients(id)
procedimento_principal      VARCHAR(20) NOT NULL
procedimento_secundario     VARCHAR(20)
data_internacao             DATE NOT NULL
data_saida                  DATE
valor                       NUMERIC(12,2) DEFAULT 0
tipo_aih                    VARCHAR(5) NOT NULL DEFAULT '1'
cnes                        VARCHAR(7) NOT NULL
cbo_medico                  VARCHAR(6)
diarias                     INTEGER DEFAULT 0
status                      VARCHAR(20) DEFAULT 'rascunho'
metadata                    JSONB DEFAULT '{}'
created_at                  TIMESTAMPTZ DEFAULT NOW()
updated_at                  TIMESTAMPTZ DEFAULT NOW()
```

**Indexes (6):** `UNIQUE(numero_aih)`, `user_id`, `patient_id`, `data_internacao DESC`, `status`, `created_at DESC`

---

## 4. Index Inventory (52 total)

### 4.1 B-tree Indexes (Standard)

| Table | Index | Column(s) | Type |
|-------|-------|-----------|------|
| patients | idx_patients_name | name | B-tree |
| patients | idx_patients_cpf | cpf | B-tree |
| health_insurers | idx_insurers_name | name | B-tree |
| health_insurers | idx_insurers_active | active | B-tree |
| medical_accounts | idx_accounts_status | status | B-tree |
| medical_accounts | idx_accounts_type | account_type | B-tree |
| medical_accounts | idx_accounts_insurer | health_insurer_id | B-tree |
| medical_accounts | idx_accounts_patient | patient_id | B-tree |
| medical_accounts | idx_accounts_created | created_at DESC | B-tree |
| medical_accounts | idx_accounts_number | account_number | B-tree |
| procedures | idx_procedures_account | medical_account_id | B-tree |
| procedures | idx_procedures_tuss | tuss_code | B-tree |
| glosas | idx_glosas_account | medical_account_id | B-tree |
| glosas | idx_glosas_status | appeal_status | B-tree |
| glosas | idx_glosas_priority | priority_score DESC | B-tree |
| glosas | idx_glosas_type | glosa_type | B-tree |
| payments | idx_payments_insurer | health_insurer_id | B-tree |
| payments | idx_payments_date | payment_date DESC | B-tree |
| payments | idx_payments_status | reconciliation_status | B-tree |
| notifications | idx_notifications_user | user_id | B-tree |
| notifications | idx_notifications_read | (user_id, read) | B-tree (composite) |
| notifications | idx_notifications_created | created_at DESC | B-tree |
| tuss_procedures | (UNIQUE) | code | B-tree |
| tuss_procedures | idx_tuss_code | code | B-tree |
| tuss_procedures | idx_tuss_chapter | chapter | B-tree |
| tuss_procedures | idx_tuss_type | procedure_type | B-tree |
| audit_logs | idx_audit_logs_user | user_id | B-tree |
| audit_logs | idx_audit_logs_resource | (resource, resource_id) | B-tree (composite) |
| audit_logs | idx_audit_logs_created | created_at DESC | B-tree |
| glosa_notifications | idx_glosa_notifications_account | medical_account_id | B-tree |
| glosa_notifications | idx_glosa_notifications_severity | severity | B-tree |
| glosa_notifications | idx_glosa_notifications_status | status | B-tree |
| glosa_notifications | idx_glosa_notifications_created | created_at DESC | B-tree |
| digital_certificates | idx_certificates_active_user | user_id WHERE status='active' | Partial UNIQUE |
| digital_certificates | idx_certificates_user | user_id | B-tree |
| digital_certificates | idx_certificates_status | status | B-tree |
| digital_certificates | idx_certificates_valid_to | valid_to | B-tree |
| digital_certificates | idx_certificates_cnpj | cnpj | B-tree |
| digital_certificates | idx_certificates_fingerprint | fingerprint | B-tree |
| sus_procedures | (UNIQUE) | (codigo_sigtap, competencia) | B-tree (composite) |
| sus_procedures | idx_sus_procedures_grupo | codigo_grupo | B-tree |
| sus_procedures | idx_sus_procedures_tipo | tipo | B-tree |
| sus_procedures | idx_sus_procedures_complexidade | complexidade | B-tree |
| sus_bpa | idx_sus_bpa_user | user_id | B-tree |
| sus_bpa | idx_sus_bpa_competencia | competencia | B-tree |
| sus_bpa | idx_sus_bpa_cnes | cnes | B-tree |
| sus_bpa | idx_sus_bpa_status | status | B-tree |
| sus_bpa | idx_sus_bpa_created | created_at DESC | B-tree |
| sus_aih | (UNIQUE) | numero_aih | B-tree |
| sus_aih | idx_sus_aih_user | user_id | B-tree |
| sus_aih | idx_sus_aih_patient | patient_id | B-tree |
| sus_aih | idx_sus_aih_internacao | data_internacao DESC | B-tree |
| sus_aih | idx_sus_aih_status | status | B-tree |
| sus_aih | idx_sus_aih_created | created_at DESC | B-tree |

### 4.2 GIN Indexes (Full-Text Search)

| Table | Index | Expression |
|-------|-------|------------|
| tuss_procedures | idx_tuss_description | `to_tsvector('portuguese', description)` |
| sus_procedures | idx_sus_procedures_nome | `to_tsvector('portuguese', nome)` |

---

## 5. RLS Policy Audit

### 5.1 Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| **patients** | All authenticated | - | - | - | Read-only for users; service_role full |
| **health_insurers** | All authenticated | - | - | - | Read-only for users; service_role full |
| **medical_accounts** | All authenticated | All authenticated | All authenticated | All authenticated | Wide-open for auth users |
| **procedures** | All authenticated | All authenticated | All authenticated | All authenticated | Wide-open for auth users |
| **glosas** | All authenticated | All authenticated | All authenticated | All authenticated | Wide-open for auth users |
| **payments** | All authenticated | All authenticated | All authenticated | All authenticated | Wide-open for auth users |
| **notifications** | Own only (user_id) | - | Own only (user_id) | - | Strict per-user |
| **tuss_procedures** | All authenticated | - | - | - | Read-only; service_role full |
| **audit_logs** | Own + admins (is_admin()) | Own only (user_id) | - | - | Insert own, read own/admin |
| **glosa_notifications** | All authenticated | - | - | - | Read-only; service_role full |
| **digital_certificates** | Own only (user_id) | Own only (user_id) | Own only (user_id) | Own only (user_id) | Strict per-user |
| **sus_procedures** | All authenticated | - | - | - | Read-only; service_role full |
| **sus_bpa** | Own only (user_id) | Own only (user_id) | Own only (user_id) | - | Per-user; no delete policy |
| **sus_aih** | Own only (user_id) | Own only (user_id) | Own only (user_id) | - | Per-user; no delete policy |

### 5.2 RLS Observations

**Strengths:**
- All 14 tables have RLS enabled
- Notifications, certificates, SUS BPA/AIH properly scoped to user_id
- Audit logs have admin escalation via `is_admin()` function
- Service role bypass available for N8N webhook operations
- Partial UNIQUE index on certificates ensures one active cert per user

**Concerns:**
- `patients` and `health_insurers` have no INSERT/UPDATE/DELETE policies for `authenticated` role - writes only work via `service_role` or if application code uses elevated privileges
- `medical_accounts`, `procedures`, `glosas`, `payments` have `FOR ALL` policies that allow any authenticated user to modify any record - RBAC is enforced at API level only, not database level
- `notifications` and `digital_certificates` `user_id` columns are NOT foreign keys to `auth.users` - orphaned records possible
- `sus_bpa` and `sus_aih` have no DELETE policies - deletion only via service_role

---

## 6. Foreign Key Relationships

```
auth.users
    ├── audit_logs.user_id (FK, enforced)
    └── (referenced but not FK'd): notifications.user_id, digital_certificates.user_id,
        sus_bpa.user_id, sus_aih.user_id

patients
    ├── medical_accounts.patient_id
    ├── sus_bpa.patient_id
    └── sus_aih.patient_id

health_insurers
    ├── medical_accounts.health_insurer_id
    └── payments.health_insurer_id

medical_accounts
    ├── procedures.medical_account_id (ON DELETE CASCADE)
    ├── glosas.medical_account_id (ON DELETE CASCADE)
    └── glosa_notifications.medical_account_id (ON DELETE CASCADE)

procedures
    └── glosas.procedure_id (no CASCADE)
```

### 6.1 FK Observations

- **CASCADE deletes** properly configured on procedures, glosas, glosa_notifications when parent account is deleted
- `glosas.procedure_id → procedures.id` has NO CASCADE - deleting a procedure with linked glosas will fail (FK violation)
- `patients.health_insurance_id` is TEXT, not a FK to `health_insurers.id` - referential integrity not enforced
- Several `user_id` columns are not FK'd to `auth.users` - allows orphaned records but prevents issues with Supabase auth cleanup

---

## 7. Trigger Audit

| Trigger | Table | Function | Event |
|---------|-------|----------|-------|
| `patients_updated_at` | patients | `update_updated_at()` | BEFORE UPDATE |
| `insurers_updated_at` | health_insurers | `update_updated_at()` | BEFORE UPDATE |
| `accounts_updated_at` | medical_accounts | `update_updated_at()` | BEFORE UPDATE |
| `glosas_updated_at` | glosas | `update_updated_at()` | BEFORE UPDATE |
| `tuss_procedures_updated_at` | tuss_procedures | `update_tuss_updated_at()` | BEFORE UPDATE |
| `glosa_notifications_updated_at` | glosa_notifications | `update_updated_at()` | BEFORE UPDATE |
| `certificates_updated_at` | digital_certificates | `update_updated_at()` | BEFORE UPDATE |
| `sus_procedures_updated_at` | sus_procedures | `update_updated_at()` | BEFORE UPDATE |
| `sus_bpa_updated_at` | sus_bpa | `update_updated_at()` | BEFORE UPDATE |
| `sus_aih_updated_at` | sus_aih | `update_updated_at()` | BEFORE UPDATE |

### 7.1 Missing Triggers

| Table | Has updated_at column? | Has trigger? |
|-------|----------------------|--------------|
| `procedures` | **No** | **No** |
| `payments` | **No** | **No** |
| `notifications` | **No** | **No** |
| `audit_logs` | **No** | **No** (immutable by design) |

---

## 8. Functions

### 8.1 `update_updated_at()`

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Generic trigger function used by 9 tables.

### 8.2 `update_tuss_updated_at()`

Duplicate of `update_updated_at()` - created separately in migration 002. Could be consolidated.

### 8.3 `is_admin()`

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Used in audit_logs RLS policy. `SECURITY DEFINER` allows checking JWT metadata regardless of caller context.

---

## 9. Supabase Configuration Highlights

| Setting | Value |
|---------|-------|
| **DB Major Version** | 17 |
| **API max_rows** | 1000 |
| **Realtime** | Enabled |
| **Storage** | Enabled, 50MiB limit |
| **Auth signup** | Enabled (email) |
| **Anonymous sign-ins** | Disabled |
| **MFA** | Disabled |
| **Password min length** | 6 |
| **JWT expiry** | 3600s (1 hour) |
| **Refresh token rotation** | Enabled |
| **Connection pooler** | Disabled |
| **Email confirmations** | Disabled |
| **SMS** | Disabled |
| **OAuth providers** | None enabled |
| **Edge Runtime** | Enabled (Deno 2) |
| **Analytics** | Enabled (Postgres backend) |

---

## 10. Data Type Consistency

### 10.1 Amount Columns

| Column | Type | Precision |
|--------|------|-----------|
| medical_accounts.total_amount | DECIMAL(12,2) | Standard |
| medical_accounts.approved_amount | DECIMAL(12,2) | Standard |
| medical_accounts.glosa_amount | DECIMAL(12,2) | Standard |
| medical_accounts.paid_amount | DECIMAL(12,2) | Standard |
| procedures.quantity | DECIMAL(10,2) | Standard |
| procedures.unit_price | DECIMAL(12,2) | Standard |
| procedures.total_price | DECIMAL(12,2) | Standard |
| glosas.original_amount | DECIMAL(12,2) | Standard |
| glosas.glosa_amount | DECIMAL(12,2) | Standard |
| payments.total_amount | DECIMAL(12,2) | Standard |
| payments.matched_amount | DECIMAL(12,2) | Standard |
| payments.unmatched_amount | DECIMAL(12,2) | Standard |
| tuss_procedures.unit_price | DECIMAL(10,2) | Inconsistent (10 vs 12) |
| glosa_notifications.potential_amount | DECIMAL(12,2) | Standard |
| sus_bpa.valor_unitario | NUMERIC(12,2) | Standard (NUMERIC vs DECIMAL) |
| sus_bpa.valor_total | NUMERIC(12,2) | Standard |
| sus_aih.valor | NUMERIC(12,2) | Standard |
| sus_procedures.valor_ambulatorial | NUMERIC(12,2) | Standard |
| sus_procedures.valor_hospitalar | NUMERIC(12,2) | Standard |

**Observation:** Mix of `DECIMAL(12,2)` and `NUMERIC(12,2)` - functionally identical in PostgreSQL but inconsistent in naming. `tuss_procedures.unit_price` uses DECIMAL(10,2) instead of DECIMAL(12,2).

### 10.2 Status Columns

All status columns use VARCHAR(20) with CHECK constraints - consistent pattern.

### 10.3 UUID Usage

All primary keys use UUID with `gen_random_uuid()` - consistent pattern.

---

## 11. Findings & Recommendations

### 11.1 Critical

| # | Finding | Impact | Table(s) |
|---|---------|--------|----------|
| C1 | RLS on core tables (`medical_accounts`, `procedures`, `glosas`, `payments`) allows ANY authenticated user to read/modify ANY record | Data breach risk if RBAC bypass occurs at API level | 4 tables |
| C2 | `patients` and `health_insurers` have no write policies for `authenticated` role | Writes may silently fail unless using service_role | 2 tables |

### 11.2 Medium

| # | Finding | Impact | Table(s) |
|---|---------|--------|----------|
| M1 | `notifications.user_id`, `digital_certificates.user_id`, `sus_bpa.user_id`, `sus_aih.user_id` not FK to `auth.users` | Orphaned records possible; no referential integrity | 4 tables |
| M2 | `patients.health_insurance_id` is TEXT, not FK to `health_insurers.id` | Broken reference possible; wrong data type | patients |
| M3 | `procedures` and `payments` have no `updated_at` column/trigger | Cannot track when records were last modified | 2 tables |
| M4 | `glosas.procedure_id` FK has no CASCADE | Deleting procedure with glosas causes FK violation | glosas |
| M5 | `sus_bpa` and `sus_aih` have no DELETE RLS policy | Records can only be deleted via service_role | 2 tables |
| M6 | Duplicate function `update_tuss_updated_at()` identical to `update_updated_at()` | Unnecessary duplication | tuss_procedures |

### 11.3 Low

| # | Finding | Impact | Table(s) |
|---|---------|--------|----------|
| L1 | `tuss_procedures.unit_price` uses DECIMAL(10,2) vs standard DECIMAL(12,2) | Inconsistent precision; max value R$99,999,999.99 vs R$9,999,999,999.99 | tuss_procedures |
| L2 | Mix of DECIMAL and NUMERIC keywords | Cosmetic inconsistency (functionally identical) | Multiple |
| L3 | `tuss_procedures.code` has both UNIQUE constraint and separate B-tree index | Redundant index (UNIQUE already creates one) | tuss_procedures |
| L4 | `ans_code` in health_insurers is VARCHAR(20) but ANS codes are 6 digits | Over-sized column | health_insurers |
| L5 | No composite index on `medical_accounts(status, created_at DESC)` | Common query pattern (list by status sorted by date) not optimized | medical_accounts |
| L6 | `procedures.status` has no CHECK constraint unlike other status columns | Accepts any string value | procedures |
| L7 | `sus_bpa.status` and `sus_aih.status` have no CHECK constraints | Accepts any string value (validated at API level only) | sus_bpa, sus_aih |

---

## 12. Entity Relationship Diagram

```
                    auth.users
                        │
                        │ FK (audit_logs only)
                        │ Referenced but not FK'd (notifications,
                        │   certificates, sus_bpa, sus_aih)
                        ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────┐         ┌──────────────────┐         │
│  │ patients │◄────────┤ medical_accounts │────────►│health_insurers│
│  └────┬─────┘    FK   └───────┬──────────┘   FK   └───────┬───────┘
│       │                       │                            │
│       │              ┌────────┼────────┐                   │
│       │              │        │        │                   │
│       │              ▼        ▼        ▼                   ▼
│       │         procedures  glosas  glosa_notif.      payments
│       │              │        ▲
│       │              │   FK   │
│       │              └────────┘
│       │
│       ├──────► sus_bpa
│       └──────► sus_aih
│
│  Standalone:
│  ├── tuss_procedures (reference data)
│  ├── sus_procedures (reference data)
│  ├── audit_logs (compliance)
│  ├── notifications (user alerts)
│  └── digital_certificates (TISS signing)
└─────────────────────────────────────────────────────┘
```

---

## 13. Migration History

| Migration | Date | Description | Tables Created | Tables Modified |
|-----------|------|-------------|----------------|-----------------|
| 001 | Initial | Core schema | patients, health_insurers, medical_accounts, procedures, glosas, payments, notifications | - |
| 002 | - | TUSS reference table | tuss_procedures (75 seed rows) | - |
| 003 | - | Audit & roles | audit_logs | - |
| 004 | - | N8N glosa alerts | glosa_notifications | - |
| 005 | - | Digital certs | digital_certificates | - |
| 006 | - | SUS module | sus_procedures, sus_bpa, sus_aih | - |
| 007 | - | SUS classification | - | sus_procedures (7 new columns, 3 indexes) |

---

## 14. Conclusion

The database schema is well-structured for a healthcare financial management system with proper use of:
- UUID primary keys throughout
- CHECK constraints on status/type enums
- GIN full-text search indexes for Portuguese
- Cascade deletes on parent-child relationships
- Immutable audit log design
- Partial unique indexes (one active cert per user)

**Primary risk areas** are the overly permissive RLS policies on core business tables (C1) where RBAC is enforced only at the API level, and several missing foreign key constraints (M1, M2) that could lead to data integrity issues.

---

*Document generated as part of Brownfield Discovery Phase 2*
*Next: Phase 3 - Frontend/UX Specification (@ux-design-expert)*
