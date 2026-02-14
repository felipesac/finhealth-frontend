# System Architecture - FinHealth Frontend

> Brownfield Discovery Phase 1 - System Documentation
> Generated: 2026-02-08 | Agent: @architect (Aria)

---

## 1. Overview

**FinHealth** is a healthcare financial management system for Brazilian hospitals and clinics. It handles medical account lifecycle, insurance claims (TISS/SUS), payment reconciliation, glosa (denial) management, and compliance reporting.

| Attribute | Value |
|-----------|-------|
| **Type** | Full-stack Next.js web application |
| **Domain** | Healthcare financial management (Brazil) |
| **Language** | Portuguese (pt-BR) |
| **Production URL** | https://finhealth.com.br |
| **Repository** | https://github.com/felipesac/finhealth-frontend |
| **Branch** | master |

---

## 2. Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.35 | App Router, SSR, API Routes |
| **React** | 18.x | UI rendering |
| **TypeScript** | 5.x | Type safety (strict mode) |
| **Tailwind CSS** | 3.4.x | Utility-first styling |

### Backend & Data

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.95.x | Auth, PostgreSQL database, Realtime |
| **@supabase/ssr** | 0.8.x | Server-side Supabase client |
| **Zod** | 4.3.x | Schema validation (API + forms) |

### UI Component Library

| Technology | Version | Purpose |
|------------|---------|---------|
| **Radix UI** | Various | Accessible headless primitives (Dialog, Select, Toast, etc.) |
| **Lucide React** | 0.563.x | Icon system |
| **class-variance-authority** | 0.7.x | Component variant management |
| **tailwind-merge** | 3.4.x | Tailwind class merging |
| **clsx** | 2.1.x | Conditional classnames |

### Data Visualization & Forms

| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 3.7.x | Dashboard charts |
| **React Hook Form** | 7.71.x | Form management |
| **@hookform/resolvers** | 5.2.x | Zod integration for forms |
| **SWR** | 2.4.x | Data fetching with caching |

### State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 5.0.x | Client state (UI prefs, dashboard config) |
| **zustand/persist** | Built-in | LocalStorage persistence |

### Notifications & Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Resend** | 6.9.x | Transactional email (glosa, payment, account alerts) |
| **web-push** | 3.6.x | Web Push notifications via VAPID |

### Monitoring & Observability

| Technology | Version | Purpose |
|------------|---------|---------|
| **@sentry/nextjs** | 10.38.x | Error tracking, source maps |

### Internationalization

| Technology | Version | Purpose |
|------------|---------|---------|
| **next-intl** | 4.8.x | i18n framework (pt-BR primary, en support) |

### Theming

| Technology | Version | Purpose |
|------------|---------|---------|
| **next-themes** | 0.4.x | Dark/light/system theme support |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | 4.0.x | Unit/integration tests |
| **@testing-library/react** | 16.3.x | Component testing |
| **Playwright** | 1.58.x | E2E tests |
| **jsdom** | 28.x | DOM environment for tests |

### DX & Quality

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 8.x | Linting (next config) |
| **Husky** | 9.1.x | Git hooks |
| **lint-staged** | 16.2.x | Pre-commit quality gate |

---

## 3. Project Structure

```
finhealth-frontend/
├── docs/
│   └── architecture/           # This document
├── e2e/                        # Playwright E2E tests (6 specs)
├── messages/                   # i18n translation files
│   ├── pt-BR.json              # Primary locale
│   └── en.json                 # English locale
├── public/
│   ├── favicon.svg
│   ├── manifest.json           # PWA manifest
│   ├── og-image.svg            # OpenGraph image
│   └── sw.js                   # Service Worker (push notifications)
├── scripts/
│   └── seed-sigtap.js          # SUS procedure table seeder
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth route group
│   │   ├── (dashboard)/        # Protected dashboard group
│   │   ├── api/                # API routes (32+ endpoints)
│   │   ├── auth/callback/      # Supabase OAuth callback
│   │   ├── layout.tsx          # Root layout (theme, toaster)
│   │   ├── error.tsx           # Global error boundary
│   │   ├── global-error.tsx    # Root error boundary
│   │   ├── not-found.tsx       # 404 page
│   │   └── page.tsx            # Root redirect → /dashboard
│   ├── components/
│   │   ├── accounts/           # Medical account components (5)
│   │   ├── admin/              # Admin panel components (4)
│   │   ├── auth/               # Auth forms (3)
│   │   ├── certificates/       # Digital certificate management (1)
│   │   ├── dashboard/          # Dashboard widgets & charts (10)
│   │   ├── glosas/             # Glosa/denial components (4)
│   │   ├── layout/             # App shell, sidebar, header (7)
│   │   ├── notifications/      # Notification dropdown (1)
│   │   ├── payments/           # Payment components (6)
│   │   ├── procedures/         # Procedure CRUD (1)
│   │   ├── realtime/           # Realtime indicator (1)
│   │   ├── reports/            # Export button (1)
│   │   ├── sus/                # SUS billing components (4)
│   │   ├── tiss/               # TISS XML components (4)
│   │   ├── tuss/               # TUSS autocomplete (2)
│   │   └── ui/                 # Shadcn/ui primitives (24)
│   ├── hooks/                  # Custom React hooks (6)
│   ├── i18n/                   # i18n configuration
│   ├── lib/                    # Core utilities
│   │   ├── supabase/           # Supabase client setup (3 files)
│   │   ├── formatters/         # Currency & date formatting (3)
│   │   ├── audit-logger.ts     # Audit trail logging
│   │   ├── certificate-parser.ts # X.509 certificate parsing
│   │   ├── email.ts            # Resend email service
│   │   ├── env.ts              # Env var validation
│   │   ├── error-tracking.ts   # Sentry abstraction
│   │   ├── push.ts             # Web Push service
│   │   ├── rate-limit.ts       # In-memory rate limiter
│   │   ├── rbac.ts             # Role-based access control
│   │   ├── sanitize-xml.ts     # TISS XML sanitization
│   │   ├── utils.ts            # cn() helper
│   │   ├── validators.ts       # Brazilian doc validators (CPF, CNPJ, CNES, CBO, ANS)
│   │   └── validations.ts      # Zod schemas (15+ schemas)
│   ├── stores/                 # Zustand stores (2)
│   └── types/                  # TypeScript types (2)
├── next.config.mjs             # Next.js + Sentry + i18n config
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## 4. Architecture Patterns

### 4.1 Routing Architecture

The application uses Next.js App Router with **route groups**:

```
src/app/
├── (auth)/                     # Unauthenticated pages
│   ├── layout.tsx              # Centered auth layout
│   ├── login/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── (dashboard)/                # Authenticated pages (protected by middleware)
│   ├── layout.tsx              # AppShell (sidebar + header + main)
│   ├── dashboard/page.tsx      # Main dashboard
│   ├── contas/                 # Medical accounts CRUD
│   ├── glosas/                 # Glosa management
│   ├── pagamentos/             # Payment management
│   ├── tiss/                   # TISS billing
│   ├── sus/                    # SUS billing
│   ├── relatorios/             # Reports & exports
│   └── configuracoes/          # Settings, users, insurers, patients, audit
└── api/                        # Backend API routes
```

**Every route segment** has its own `loading.tsx` (skeleton) and `error.tsx` (error boundary).

### 4.2 Authentication Flow

```
┌──────────┐     ┌────────────┐     ┌──────────────┐
│  Browser  │────>│ middleware  │────>│ Supabase Auth│
│           │     │  (CSRF +   │     │   (getUser)  │
│           │     │  session)  │     │              │
└──────────┘     └────────────┘     └──────────────┘
                       │
                  ┌────┴────┐
                  │         │
           Authed?│    Not Authed?
                  │         │
                  ▼         ▼
           ┌──────────┐  ┌─────┐
           │ Dashboard │  │Login│
           └──────────┘  └─────┘
```

- **Middleware** (`src/middleware.ts`): CSRF validation on mutations + Supabase session refresh
- **Auth routes**: Login, Forgot Password, Reset Password, OAuth Callback
- **Session management**: Cookie-based via `@supabase/ssr`
- **Protected routes**: All non-auth paths redirect to `/login` if unauthenticated

### 4.3 API Route Pattern

Every API route follows this consistent pattern:

```
1. Rate Limiting    → rateLimit(key, { limit, windowSeconds })
2. Authentication   → checkPermission(supabase, 'resource:action')
3. Input Validation → zodSchema.safeParse(body)
4. Business Logic   → Supabase query
5. Audit Logging    → auditLog(supabase, userId, entry)
6. Response         → NextResponse.json({ success, data/error })
```

### 4.4 RBAC Model

Four roles with granular permissions:

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **admin** | Full access | `admin:all` (wildcard) |
| **finance_manager** | Financial operations | All read/write except admin |
| **auditor** | Read-only monitoring | Accounts, glosas, payments, reports, audit log |
| **tiss_operator** | TISS-specific | Accounts read, TISS read/write |

Roles are stored in Supabase `user_metadata.role`, defaulting to `finance_manager`.

### 4.5 State Management

| Store | Middleware | Keys Persisted |
|-------|-----------|----------------|
| `useUIStore` | `persist('finhealth-ui')` | `sidebarCollapsed` |
| `useDashboardStore` | `persist('finhealth-dashboard')` | `widgets[]` (visibility, order) |

Server state is fetched directly via Supabase queries in Server Components or via `fetch()` + SWR in Client Components.

### 4.6 Component Architecture

```
                Root Layout
                    │
            ┌───────┴────────┐
            │                │
      (auth)/layout    (dashboard)/layout
            │                │
       Auth Forms       ┌────┴────────┐
                        │   AppShell  │
                        ├─────────────┤
                        │ Sidebar     │
                        │ Header      │
                        │ Breadcrumbs │
                        │ Main Content│
                        │ MobileNav   │
                        └─────────────┘
```

**UI Component Library**: shadcn/ui pattern (Radix primitives + Tailwind + CVA).
24 base UI components in `src/components/ui/`.

---

## 5. Database Schema (Supabase PostgreSQL)

### 5.1 Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  patients    │◄────┤ medical_accounts │────►│health_insurers│
│             │     │                  │     │              │
│ id (uuid)   │     │ id (uuid)        │     │ id (uuid)    │
│ name        │     │ account_number   │     │ ans_code     │
│ cpf         │     │ patient_id (FK)  │     │ name         │
│ birth_date  │     │ insurer_id (FK)  │     │ cnpj         │
│ gender      │     │ account_type     │     │ tiss_version │
│ phone       │     │ status           │     │ active       │
│ email       │     │ total_amount     │     └──────────────┘
│ address     │     │ approved_amount  │
└─────────────┘     │ glosa_amount     │
                    │ paid_amount      │
                    │ admission_date   │
                    │ discharge_date   │
                    │ tiss_*           │
                    │ audit_score      │
                    │ glosa_risk_score │
                    └───────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
      ┌──────────┐  ┌───────────┐  ┌──────────┐
      │procedures│  │  glosas   │  │ payments │
      │          │  │           │  │          │
      │ tuss_code│  │ glosa_code│  │ total_amt│
      │ sigtap   │  │ glosa_type│  │ matched  │
      │ quantity │  │ amount    │  │ unmatched│
      │ price    │  │ appeal_*  │  │ recon_st │
      └──────────┘  └───────────┘  └──────────┘

      ┌──────────────────┐  ┌──────────────┐
      │ audit_logs       │  │ sus_bpa      │
      │                  │  │ sus_aih      │
      │ user_id (FK)     │  │ sus_procedures│
      │ action           │  └──────────────┘
      │ resource         │
      │ resource_id      │  ┌──────────────────┐
      │ details (jsonb)  │  │digital_certificates│
      │ ip               │  └──────────────────┘
      └──────────────────┘
```

### 5.2 Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `medical_accounts` | Hospital accounts | account_number, type, status, amounts, TISS data |
| `patients` | Patient registry | name, cpf, birth_date, insurance |
| `health_insurers` | Insurance companies | ans_code, cnpj, tiss_version |
| `procedures` | Medical procedures per account | tuss/sigtap/cbhpm codes, quantity, pricing |
| `glosas` | Insurance denials | glosa_code, type, amounts, appeal tracking |
| `payments` | Insurance payments | amounts, reconciliation status |
| `audit_logs` | System audit trail | action, resource, details, IP |
| `sus_bpa` | SUS outpatient billing | CNES, CBO, procedure, competencia |
| `sus_aih` | SUS inpatient billing | AIH number, dates, valor |
| `sus_procedures` | SIGTAP procedure table | sigtap code, values, classification |
| `digital_certificates` | A1 certificates | X.509 data, validity, fingerprint |

### 5.3 Key Enums

| Type | Values |
|------|--------|
| **AccountType** | internacao, ambulatorial, sadt, honorarios |
| **AccountStatus** | pending, validated, sent, paid, glosa, appeal |
| **GlosaType** | administrativa, tecnica, linear |
| **AppealStatus** | pending, in_progress, sent, accepted, rejected |
| **UserRole** | admin, finance_manager, auditor, tiss_operator |
| **SusStatus** | rascunho, validado, enviado, aprovado, rejeitado |

---

## 6. API Routes

### 6.1 Full API Route Inventory

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/api/accounts` | accounts:write | Create medical account |
| GET/PUT/DELETE | `/api/accounts/[id]` | accounts:read/write | Account CRUD by ID |
| POST | `/api/accounts/bulk` | accounts:write | Bulk operations on accounts |
| POST | `/api/appeals` | appeals:write | Submit/save appeal |
| GET | `/api/audit-logs` | audit:read | Fetch audit log entries |
| POST | `/api/certificates` | certificates:write | Upload digital certificate |
| POST | `/api/export` | export:read | Export data (CSV/JSON) |
| GET/POST | `/api/glosas` | glosas:read/write | List/create glosas |
| GET/PUT/DELETE | `/api/glosas/[id]` | glosas:read/write | Glosa CRUD by ID |
| POST | `/api/glosas/bulk` | glosas:write | Bulk glosa operations |
| GET/POST | `/api/insurers` | settings:read/write | Health insurer CRUD |
| GET | `/api/notifications` | notifications:read | List notifications |
| POST | `/api/notifications/send` | notifications:write | Send notification (email + push) |
| POST | `/api/notifications/push-subscribe` | notifications:write | Register push subscription |
| PUT | `/api/notifications/preferences` | notifications:write | Update preferences |
| GET/POST | `/api/patients` | settings:read/write | Patient CRUD |
| GET/POST | `/api/payments` | payments:read/write | Payment CRUD |
| GET/PUT/DELETE | `/api/payments/[id]` | payments:read/write | Payment by ID |
| POST | `/api/payments/upload` | payments:write | Upload payment file |
| GET/POST | `/api/procedures` | accounts:read/write | Procedure CRUD |
| GET/PUT/DELETE | `/api/procedures/[id]` | accounts:read/write | Procedure by ID |
| POST | `/api/reconcile` | reconcile:write | Payment-account reconciliation |
| GET | `/api/settings/tiss` | settings:read | TISS configuration |
| POST | `/api/sus/aih` | sus:write | Create AIH record |
| POST | `/api/sus/bpa` | sus:write | Create BPA record |
| GET | `/api/sus/sigtap` | sus:read | Search SIGTAP procedures |
| POST | `/api/tiss/upload` | tiss:write | Upload/validate TISS XML |
| GET | `/api/trends` | reports:read | Trend data for charts |
| GET | `/api/tuss` | accounts:read | Search TUSS procedures |
| POST | `/api/tuss/seed` | admin:all | Seed TUSS table |
| GET/POST | `/api/users` | admin:all | User management |
| PUT/DELETE | `/api/users/[id]` | admin:all | User CRUD by ID |

### 6.2 N8N Webhook Integrations

External automation endpoints (configured via env vars, not internal API routes):

| Webhook | Purpose |
|---------|---------|
| `N8N_TISS_WEBHOOK_URL` | TISS file processing automation |
| `N8N_BILLING_WEBHOOK_URL` | Billing agent automation |
| `N8N_GLOSA_WEBHOOK_URL` | Glosa notification automation |

---

## 7. Security Architecture

### 7.1 Security Headers (next.config.mjs)

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| HSTS | max-age=63072000; includeSubDomains; preload |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| CSP | default-src 'self'; connect-src 'self' https://*.supabase.co |

### 7.2 CSRF Protection

Middleware validates `Origin` header on all non-safe methods (POST, PUT, DELETE).

### 7.3 Rate Limiting

In-memory rate limiter with automatic cleanup (5-minute intervals). Applied per-IP on all API routes.

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Account creation | 20 req | 60s |
| (Other routes follow similar patterns) | | |

### 7.4 Input Validation

All API routes use Zod schema validation. 15+ schemas defined in `src/lib/validations.ts`.

### 7.5 Audit Trail

Fire-and-forget audit logging to `audit_logs` table. Captures: action, resource, resource_id, details (JSONB), client IP.

### 7.6 Robots

`robots: { index: false, follow: false }` - internal application, not indexed.

---

## 8. Frontend Pages Inventory

### 8.1 Dashboard Module

| Route | Page | Key Components |
|-------|------|----------------|
| `/dashboard` | Main dashboard | MetricsGrid, GlosasChart, AccountsStatusChart, PaymentsChart, GlosasTrendMini, RecentAccounts, QuickActions, DashboardCustomizer, DashboardWidgets, RealtimeDashboard |

### 8.2 Medical Accounts Module

| Route | Page | Features |
|-------|------|----------|
| `/contas` | Accounts list | Filterable table, bulk actions, search, sorting |
| `/contas/nova` | Create account | Form with validation, patient/insurer dropdowns |
| `/contas/[id]` | Account detail | Full account info, procedures, TISS data |

### 8.3 Glosas Module

| Route | Page | Features |
|-------|------|----------|
| `/glosas` | Glosa panel | Table with filters, appeal actions |
| `/glosas/operadora` | By insurer | Glosa breakdown per health insurer |
| `/glosas/faturamento` | Billing view | Glosa impact on billing |
| `/glosas/[id]` | Glosa detail | Full detail + appeal form |

### 8.4 Payments Module

| Route | Page | Features |
|-------|------|----------|
| `/pagamentos` | Payments panel | Table, filters, file upload |
| `/pagamentos/conciliacao` | Reconciliation | Payment-account matching |
| `/pagamentos/inadimplencia` | Delinquency | Overdue tracking, escalation actions |
| `/pagamentos/[id]` | Payment detail | Full detail + reconciliation badge |

### 8.5 TISS Module

| Route | Page | Features |
|-------|------|----------|
| `/tiss` | Guide list | TISS guide management |
| `/tiss/upload` | XML upload | Drag-drop XML upload + validation |
| `/tiss/validacao` | Validation | XML validation results |
| `/tiss/lotes` | Batches | TISS batch management |
| `/tiss/certificados` | Certificates | A1 digital certificate management |
| `/tiss/viewer/[id]` | XML viewer | Parsed TISS XML display |

### 8.6 SUS Module

| Route | Page | Features |
|-------|------|----------|
| `/sus` | SUS overview | Summary dashboard |
| `/sus/bpa` | BPA | Outpatient billing form |
| `/sus/aih` | AIH | Inpatient billing form |
| `/sus/sigtap` | SIGTAP | Procedure search & reference |
| `/sus/remessa` | Remessa | SUS file submission |

### 8.7 Reports Module

| Route | Page | Features |
|-------|------|----------|
| `/relatorios` | Reports hub | Navigation to report types |
| `/relatorios/faturamento` | Billing report | Billing analytics |
| `/relatorios/glosas-operadora` | Glosas by insurer | Denial analytics per insurer |
| `/relatorios/producao` | Production report | Production metrics |
| `/relatorios/tendencias` | Trends | Time-series trend analysis |
| `/relatorios/exportar` | Export | Multi-format data export |

### 8.8 Settings Module

| Route | Page | Features |
|-------|------|----------|
| `/configuracoes` | General settings | Profile, preferences |
| `/configuracoes/usuarios` | User management | Invite, role management (admin only) |
| `/configuracoes/operadoras` | Health insurers | CRUD with ANS code, CNPJ |
| `/configuracoes/pacientes` | Patients | CRUD with CPF validation |
| `/configuracoes/auditoria` | Audit log | Searchable audit trail viewer |

---

## 9. Custom Hooks

| Hook | Purpose |
|------|---------|
| `useApiRequest` | Wraps fetch with 429 rate-limit toast handling |
| `useDebounce` | Debounce values for search inputs |
| `useKeyboardShortcuts` | Alt+key navigation shortcuts (D, C, G, P, T, R, S) |
| `useRealtimeSubscription` | Supabase Realtime PostgreSQL changes listener |
| `useRealtimeTable` | Higher-level table sync via Realtime |
| `useToast` | Toast notification management (Radix) |

---

## 10. Brazilian Healthcare Domain Specifics

### 10.1 Regulatory Standards

| Standard | Description | Integration |
|----------|-------------|-------------|
| **TISS** | Troca de Informacao em Saude Suplementar | XML upload, validation, guide management |
| **SUS/SIH** | Sistema Unico de Saude | BPA (outpatient) + AIH (inpatient) billing |
| **SIGTAP** | Sistema de Gerenciamento da Tabela de Procedimentos | Procedure code reference table |
| **TUSS** | Terminologia Unificada da Saude Suplementar | Procedure autocomplete |
| **CBHPM** | Classificacao Brasileira Hierarquizada de Procedimentos Medicos | Procedure coding |
| **ANS** | Agencia Nacional de Saude Suplementar | Health insurer registry codes |

### 10.2 Brazilian Document Validators

| Validator | Function |
|-----------|----------|
| CPF | `isValidCPF()` - 11-digit with check digits |
| CNPJ | `isValidCNPJ()` - 14-digit with weighted check |
| CNES | `isValidCNES()` - 7-digit health establishment code |
| CBO | `isValidCBO()` - 6-digit occupation code |
| ANS | `isValidANS()` - 6-digit insurer code |

---

## 11. Integration Points

### 11.1 External Services

```
┌─────────────────┐
│   FinHealth      │
│   (Next.js)      │
├─────────────────┤
│                 │──── Supabase (Auth + PostgreSQL + Realtime)
│                 │──── Resend (Transactional Email)
│                 │──── Web Push (VAPID Push Notifications)
│                 │──── Sentry (Error Monitoring)
│                 │──── N8N (Webhook Automations)
│                 │──── Vercel (Hosting + CDN)
└─────────────────┘
```

### 11.2 Realtime Architecture

Supabase Realtime via PostgreSQL LISTEN/NOTIFY:
- Dashboard auto-refreshes on database changes
- `useRealtimeSubscription` hook wraps channel management
- `RealtimeDashboard` component shows live-updating data
- `RealtimeIndicator` shows connection status

---

## 12. Environment Configuration

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client+Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client+Server | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | Client+Server | Application base URL |
| `N8N_TISS_WEBHOOK_URL` | Server | N8N TISS automation |
| `N8N_BILLING_WEBHOOK_URL` | Server | N8N billing automation |
| `N8N_GLOSA_WEBHOOK_URL` | Server | N8N glosa automation |
| `RESEND_API_KEY` | Server | Resend email API key |
| `RESEND_FROM_EMAIL` | Server | Sender email address |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client | VAPID public key for push |
| `VAPID_PUBLIC_KEY` | Server | VAPID public key |
| `VAPID_PRIVATE_KEY` | Server | VAPID private key |
| `VAPID_SUBJECT` | Server | VAPID subject (mailto:) |
| `NEXT_PUBLIC_SENTRY_DSN` | Client | Sentry DSN |
| `SENTRY_ORG` | Server | Sentry organization |
| `SENTRY_PROJECT` | Server | Sentry project name |

---

## 13. Test Coverage

### 13.1 Test Statistics

| Category | Count |
|----------|-------|
| **Unit/Integration test files** | 69 |
| **Total tests** | 384 |
| **E2E test specs** | 6 |
| **API route tests** | 18 |
| **Component tests** | 44 |
| **Library tests** | 7 |

### 13.2 Testing Patterns

- **Component tests**: `@testing-library/react` with mocked stores, router, and fetch
- **API route tests**: Direct handler invocation with mocked Supabase client
- **Chart tests**: Recharts mocked as simple div elements
- **E2E tests**: Playwright specs for auth flow, navigation, accessibility

### 13.3 Quality Gates (lint-staged)

On every commit:
1. `next lint --fix --file` on changed `.ts/.tsx` files
2. `vitest related --run` on affected test files

---

## 14. Deployment

| Aspect | Detail |
|--------|--------|
| **Platform** | Vercel |
| **Build command** | `next build` |
| **Output** | Static + SSR (66 pages) |
| **Domain** | finhealth.com.br |
| **Environment** | 9 env vars configured (production) |
| **Source maps** | Uploaded to Sentry (hidden in production) |
| **Auto-deploy** | GitHub integration on push to master |

---

## 15. Architecture Decision Records

### ADR-1: Next.js App Router over Pages Router
- **Decision**: App Router with route groups
- **Rationale**: Server Components reduce client bundle; route groups separate auth/dashboard layouts

### ADR-2: Supabase as sole backend
- **Decision**: No separate backend API server
- **Rationale**: Supabase provides auth, database, realtime, and storage; Next.js API routes handle business logic

### ADR-3: In-memory rate limiting
- **Decision**: Simple Map-based rate limiter instead of Redis
- **Rationale**: Single Vercel instance; adequate for current scale; can migrate to Redis if needed

### ADR-4: Zod for all validation
- **Decision**: Zod schemas shared between API routes and client forms
- **Rationale**: Single source of truth for validation; type inference reduces boilerplate

### ADR-5: shadcn/ui component library
- **Decision**: Copy-paste Radix+Tailwind components over npm dependency
- **Rationale**: Full control, no version lock-in, customizable per project needs

### ADR-6: Portuguese-first UI
- **Decision**: pt-BR as default with next-intl infrastructure for future en support
- **Rationale**: Target users are Brazilian healthcare professionals; i18n framework ready for expansion

---

*Document generated as part of Brownfield Discovery Phase 1*
*Next: Phase 2 - Database Audit (@data-engineer)*
