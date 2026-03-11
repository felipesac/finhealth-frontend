# CLAUDE.md - FinHealth Frontend

Este arquivo fornece orientação ao Claude Code ao trabalhar com finhealth-frontend.

---

## O que é FinHealth?

**FinHealth Frontend** é um sistema de gestão financeira hospitalar. Dashboard completo para:
- Faturamento de procedimentos
- Glosas e recursos
- Pagamentos e conciliação bancária
- Integração TISS (XML)
- Tabela SUS (BPA, AIH, SIGTAP)
- Relatórios avançados

**Stack:** Next.js 15 (App Router) + React 18 + Tailwind + Supabase

---

## Requisitos

- **Node.js**: 18+ (v20+ recomendado)
- **npm**: 9+
- **Supabase**: Projeto com autenticação configurada
- **TypeScript**: 5+

---

## Setup Inicial

### 1. Instalar Dependencies
```bash
npm install
```

### 2. Configurar Ambiente
Criar `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima

# Opcional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Iniciar Desenvolvimento
```bash
npm run dev
```

Abrir http://localhost:3000

---

## Estrutura do Projeto

### Root Directories
```
finhealth-frontend/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilitários
│   ├── stores/                 # Zustand state
│   ├── types/                  # TypeScript types
│   └── middleware.ts           # Auth middleware
├── tests/                      # Unit tests (Vitest)
├── e2e/                        # E2E tests (Playwright)
├── public/                     # Static assets
├── package.json
└── tsconfig.json
```

### App Router Structure
```
src/app/
├── (auth)/
│   └── login/                  # Página de login
├── (dashboard)/                # Rotas protegidas (layout + auth)
│   ├── layout.tsx              # Dashboard layout
│   ├── dashboard/              # Painel principal
│   ├── contas/                 # Medical accounts
│   ├── glosas/                 # Chargebacks & appeals
│   ├── pagamentos/             # Payments & reconciliation
│   ├── tiss/                   # TISS guides
│   ├── sus/                    # SUS procedures
│   ├── relatorios/             # Reports
│   └── configuracoes/          # Settings
├── api/                        # API routes
│   ├── accounts/               # POST /api/accounts
│   ├── appeals/                # PATCH /api/appeals
│   ├── certificates/           # GET/POST/DELETE /api/certificates
│   ├── export/                 # POST /api/export
│   ├── notifications/          # GET/PATCH /api/notifications
│   ├── reconcile/              # POST /api/reconcile
│   ├── sus/                    # SUS endpoints
│   ├── tiss/                   # TISS endpoints
│   ├── trends/                 # GET /api/trends
│   └── tuss/                   # TUSS search
├── error.tsx                   # Global error boundary
├── layout.tsx                  # Root layout
└── page.tsx                    # Home page
```

### Components Organization
```
src/components/
├── accounts/                   # Contas médicas
│   ├── account-form.tsx
│   ├── account-list.tsx
│   └── account-details.tsx
├── auth/                       # Autenticação
│   ├── login-form.tsx
│   └── logout-button.tsx
├── certificates/              # Certificados digitais A1
│   ├── certificate-manager.tsx
│   └── certificate-upload.tsx
├── dashboard/                  # Métricas e gráficos
│   ├── metrics-card.tsx
│   ├── billing-chart.tsx
│   └── trends-panel.tsx
├── glosas/                     # Glosas e recursos
│   ├── glosa-list.tsx
│   ├── glosa-details.tsx
│   ├── appeal-form.tsx
│   └── appeal-status-badge.tsx
├── layout/                     # Shell components
│   ├── app-shell.tsx
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── breadcrumb.tsx
├── notifications/              # Notificações
│   ├── notification-dropdown.tsx
│   └── notification-item.tsx
├── payments/                   # Pagamentos
│   ├── payment-list.tsx
│   ├── reconciliation-panel.tsx
│   └── payment-details.tsx
├── reports/                    # Relatórios
│   ├── report-export-button.tsx
│   └── report-filters.tsx
├── sus/                        # SUS forms
│   ├── bpa-form.tsx           # Boletim Produção Ambulatorial
│   ├── aih-form.tsx           # Autorização Internação
│   ├── sigtap-search.tsx      # SIGTAP lookup
│   └── sigtap-table.tsx
├── tiss/                       # TISS guides
│   ├── tiss-uploader.tsx
│   ├── tiss-validator.tsx
│   └── guide-viewer.tsx
├── tuss/                       # TUSS autocomplete
│   └── tuss-search.tsx
└── ui/                         # shadcn/ui components (23)
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── form.tsx
    ├── input.tsx
    ├── label.tsx
    ├── select.tsx
    ├── sheet.tsx
    ├── table.tsx
    ├── tabs.tsx
    ├── toast.tsx
    └── ...
```

### Lib Utilities
```
src/lib/
├── formatters/
│   ├── currency.ts             # Formatar moeda (BRL)
│   ├── date.ts                 # Formatar data
│   └── number.ts               # Formatar números
├── supabase/
│   ├── client.ts               # Cliente Supabase (browser)
│   ├── server.ts               # Cliente Supabase (server)
│   └── admin.ts                # Admin client
├── validations.ts              # Zod schemas para formulários
├── rbac.ts                     # Role-based access control
├── rate-limit.ts               # Rate limiting
├── audit-logger.ts             # Logging de operações críticas
└── utils.ts                    # Funções gerais (cn, etc)
```

### Stores (Zustand)
```
src/stores/
├── ui.ts                       # UI state (modals, sidebar, etc)
├── filters.ts                  # Filtros de página
└── user.ts                     # User context (auth, role, etc)
```

### Types
```
src/types/
├── account.ts                  # Contas médicas
├── glosa.ts                    # Glosas
├── payment.ts                  # Pagamentos
├── certificate.ts              # Certificados
├── sus.ts                      # SUS (BPA, AIH, SIGTAP)
├── tiss.ts                     # TISS
├── api.ts                      # API responses
└── database.ts                 # Tabelas Supabase
```

---

## Comandos Principais

### Desenvolvimento
```bash
npm run dev              # Next.js dev server (http://localhost:3000)
npm run build            # Build de produção
npm start                # Rodar prod build
```

### Testes
```bash
npm test                 # Vitest (unit tests)
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Cobertura de testes
npm run test:e2e         # Playwright E2E
npm run test:e2e:ui      # Playwright com UI (debug)
```

### Qualidade de Código
```bash
npm run lint             # ESLint
npm run typecheck        # TypeScript type checking
```

### Utilitários
```bash
npm run seed:sigtap      # Seed tabela SIGTAP (4.948 procedimentos)
```

---

## Padrões de Desenvolvimento

### 1. Componentes React
Sempre com interface props tipada:

```typescript
interface DashboardProps {
  accountId: string
  showMetrics?: boolean
}

export function Dashboard({ accountId, showMetrics = true }: DashboardProps) {
  // Component logic
}
```

### 2. Forms com React Hook Form + Zod
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Schema Zod
const createAccountSchema = z.object({
  name: z.string().min(3),
  cnpj: z.string().regex(/\d{14}/),
})

type CreateAccountInput = z.infer<typeof createAccountSchema>

export function CreateAccountForm() {
  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### 3. API Routes com Type Safety
```typescript
// src/app/api/accounts/route.ts
import { createServerClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    // Operação
    const { data, error } = await supabase
      .from('medical_accounts')
      .insert(body)
      .select()

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    return Response.json(
      { error: 'Failed to create account' },
      { status: 400 }
    )
  }
}
```

### 4. Data Fetching com React Query
```typescript
import { useQuery } from '@tanstack/react-query'

export function useAccounts(tenantId: string) {
  return useQuery({
    queryKey: ['accounts', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/accounts?tenant=${tenantId}`)
      return response.json()
    },
  })
}
```

### 5. State com Zustand
```typescript
// stores/filters.ts
import { create } from 'zustand'

interface FilterState {
  status: string | null
  operadora: string | null
  setStatus: (status: string | null) => void
}

export const useFilterStore = create<FilterState>((set) => ({
  status: null,
  operadora: null,
  setStatus: (status) => set({ status }),
}))
```

---

## Segurança

### Authentication
- Supabase Auth com SSR cookies
- Middleware verifica tokens em `src/middleware.ts`
- Redirect para login se não autenticado

### Authorization (RBAC)
4 roles: `admin`, `finance_manager`, `auditor`, `tiss_operator`

```typescript
// lib/rbac.ts
export function canEditAccount(userRole: string): boolean {
  return ['admin', 'finance_manager'].includes(userRole)
}
```

### Database (RLS)
Row Level Security habilitado no Supabase:
- Usuários veem apenas dados do seu `tenant_id`
- Policies verificam role do usuário

```sql
-- RLS Policy example
CREATE POLICY "users_can_read_own_accounts" ON medical_accounts
  FOR SELECT USING (tenant_id = auth.uid()::uuid)
```

### Rate Limiting
Todas API routes com rate limit:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
})
```

### Validação
Zod em todas entradas:

```typescript
// lib/validations.ts
export const createAccountSchema = z.object({
  name: z.string().min(1).max(255),
  cnpj: z.string().regex(/^\d{14}$/),
  email: z.string().email(),
})
```

### Auditoria
Log de operações críticas:

```typescript
// lib/audit-logger.ts
export async function logAuditEvent(
  action: string,
  resourceId: string,
  details: Record<string, any>
) {
  // Log para tabela audit_logs com IP, timestamp, user, etc
}
```

---

## Banco de Dados (Supabase)

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `patients` | Pacientes |
| `health_insurers` | Operadoras de saúde |
| `medical_accounts` | Contas médicas |
| `procedures` | Procedimentos |
| `glosas` | Glosas e recursos |
| `payments` | Pagamentos |
| `digital_certificates` | Certificados digitais A1 |
| `sus_bpa` | Boletins de Produção |
| `sus_aih` | Autorizações de Internação |
| `sus_procedures` | Tabela SIGTAP (4.948) |
| `audit_logs` | Logs de auditoria |
| `notifications` | Notificações |

### RLS Policies
Todas tabelas com RLS habilitado. Verificar `Supabase Dashboard → Security → Policies`

---

## Testes

### Unit Tests (Vitest)
```bash
npm test                           # Rodar todos
npm test -- --run account.test     # Test específico
npm run test:watch                 # Watch mode
npm run test:coverage              # Ver cobertura
```

Exemplos em `tests/**/*.test.ts`:

```typescript
describe('Currency Formatter', () => {
  it('should format BRL currency', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00')
  })
})
```

### E2E Tests (Playwright)
```bash
npm run test:e2e                   # Rodar tudo
npm run test:e2e:ui                # UI para debug
```

Exemplos em `e2e/**/*.spec.ts`:

```typescript
test('should login and view dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'user@example.com')
  await page.fill('[name=password]', 'password')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/dashboard')
})
```

---

## Módulos Principais

### Dashboard
- Métricas: faturamento, glosas, pagamentos
- Gráficos: glosas por tipo, tendências
- Cards: últimas contas, pedidos em aberto

### Contas Médicas
- Listagem com filtros (status, tipo, operadora)
- Paginação
- Detalhes com procedimentos
- Formulário de criação

### Glosas
- Painel com tabs (pendentes, em recurso, resolvidas)
- Detalhes com recomendação de IA
- Formulário de recurso (rascunho + envio)
- Agregação por operadora

### Pagamentos
- Listagem de pagamentos
- Conciliação bancária
- Vinculação de contas

### TISS
- Upload de XML com validação
- Visualizador de guia
- Status de validações

### SUS
- BPA (Boletim de Produção Ambulatorial)
- AIH (Autorização de Internação)
- SIGTAP (4.948 procedimentos)

### Relatórios
- Faturamento mensal
- Glosas por operadora
- Trends
- Produção médica
- Exportação CSV/PDF

### Configurações
- Perfil do usuário
- Alteração de senha
- Integração TISS
- Certificados digitais A1

---

## Deployment

### Build Production
```bash
npm run build
```

Gera `.next/` otimizado.

### Deploy em Vercel (Recomendado)
```bash
vercel deploy
```

Ou via GitHub → Vercel auto-deploy em push para `main`.

### Variáveis de Ambiente (Produção)
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

---

## Troubleshooting

### Build fails
```bash
npm run clean
npm install
npm run build
```

### TypeScript errors
```bash
npm run typecheck
```

### Tests fail
```bash
npm run test -- --no-coverage  # Sem coverage
npm run test:watch             # Debug iterativo
```

### E2E flaky
- Aumentar timeout em `playwright.config.ts`
- Verificar se app está rodando
- Usar `page.waitForSelector()` para elementos dinâmicos

---

## Referências

- **Next.js 15 Docs**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://radix-ui.com
- **Vitest**: https://vitest.dev
- **Playwright**: https://playwright.dev

---

*FinHealth Frontend v0.1.0 - Hospital Financial Management*
