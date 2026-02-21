# FinHealth Frontend

Sistema de gestao financeira hospitalar. Dashboard completo para faturamento, glosas, pagamentos, TISS, SUS e conciliacao bancaria.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **UI:** shadcn/ui + Tailwind CSS + Radix UI
- **Formularios:** React Hook Form + Zod
- **Estado:** Zustand
- **Graficos:** Recharts
- **Testes:** Vitest + Testing Library

## Requisitos

- Node.js 18+
- Conta Supabase com projeto configurado

## Instalacao

```bash
npm install
```

Crie o arquivo `.env.local` com as variaveis do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

## Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm run start` | Servidor de producao |
| `npm run lint` | Verificacao de estilo (ESLint) |
| `npm run typecheck` | Verificacao de tipos (TypeScript) |
| `npm test` | Testes unitarios (Vitest) |
| `npm run test:coverage` | Testes com cobertura |

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/login/              # Autenticacao
│   ├── (dashboard)/               # Paginas protegidas
│   │   ├── dashboard/             # Painel principal
│   │   ├── contas/                # Contas medicas
│   │   ├── glosas/                # Glosas e recursos
│   │   ├── pagamentos/            # Pagamentos e conciliacao
│   │   ├── tiss/                  # Guias TISS
│   │   ├── sus/                   # BPA, AIH, SIGTAP
│   │   ├── relatorios/            # Relatorios
│   │   └── configuracoes/         # Configuracoes do sistema
│   └── api/                       # API Routes
├── components/
│   ├── accounts/                  # Componentes de contas
│   ├── auth/                      # Login
│   ├── certificates/              # Certificados digitais
│   ├── dashboard/                 # Metricas e graficos
│   ├── glosas/                    # Tabela e formulario de recurso
│   ├── layout/                    # AppShell, Header, Sidebar
│   ├── notifications/             # Dropdown de notificacoes
│   ├── payments/                  # Tabela e conciliacao
│   ├── reports/                   # Botao de exportacao
│   ├── sus/                       # Formularios BPA/AIH, busca SIGTAP
│   ├── tiss/                      # Guias, upload, visualizador
│   ├── tuss/                      # Autocomplete TUSS
│   └── ui/                        # shadcn/ui (23 componentes)
├── hooks/                         # Custom hooks (toast)
├── lib/
│   ├── formatters/                # Moeda, data, numeros
│   ├── supabase/                  # Cliente server/client
│   ├── validations.ts             # Schemas Zod
│   ├── rbac.ts                    # Controle de acesso por role
│   ├── rate-limit.ts              # Rate limiting
│   └── audit-logger.ts            # Log de auditoria
├── stores/                        # Zustand (UI state)
└── types/                         # TypeScript types
```

## Modulos

### Dashboard
Visao geral com metricas de faturamento, grafico de glosas por tipo e contas recentes.

### Contas Medicas
Listagem com filtros (status, tipo, operadora), paginacao, detalhes com procedimentos e formulario de criacao.

### Glosas
Painel com tabs por status (pendentes, em recurso, resolvidas), detalhes com recomendacao de IA, formulario de recurso com rascunho e envio, agregacao por operadora e faturamento.

### Pagamentos
Listagem de pagamentos, detalhes com conciliacao bancaria, vinculacao de contas a pagamentos.

### TISS
Listagem de guias, upload de XML com validacao, visualizador de guia, listagem de validacoes com status e contagem de erros.

### SUS
BPA (Boletim de Producao Ambulatorial), AIH (Autorizacao de Internacao Hospitalar), tabela SIGTAP com 4.948 procedimentos e busca.

### Relatorios
Faturamento mensal, glosas por operadora, tendencias, producao medica por tipo e operadora, exportacao de dados.

### Configuracoes
Perfil do usuario, alteracao de senha, integracao TISS, gestao de certificados digitais A1.

## API Routes

| Rota | Metodos | Descricao |
|------|---------|-----------|
| `/api/accounts` | POST | Criar conta medica |
| `/api/appeals` | PATCH | Recurso de glosa |
| `/api/certificates` | GET, POST, DELETE | Certificados digitais |
| `/api/export` | POST | Exportacao de dados |
| `/api/notifications` | GET, PATCH | Notificacoes |
| `/api/reconcile` | POST | Conciliacao bancaria |
| `/api/sus/bpa` | GET, POST | BPA |
| `/api/sus/aih` | GET, POST | AIH |
| `/api/sus/sigtap` | GET | Busca SIGTAP |
| `/api/tiss/upload` | POST | Upload XML TISS |
| `/api/trends` | GET | Dados de tendencias |
| `/api/tuss` | GET | Busca TUSS |
| `/api/tuss/seed` | POST | Seed de procedimentos |

## Seguranca

- **Autenticacao:** Supabase Auth com SSR cookies
- **RBAC:** 4 roles (admin, finance_manager, auditor, tiss_operator)
- **RLS:** Row Level Security no PostgreSQL
- **Rate Limiting:** Em todas as API routes
- **Validacao:** Zod em todas as entradas
- **Auditoria:** Log de operacoes criticas com IP

## Testes

```bash
# Unitarios (124 testes)
npm test

# Com cobertura
npm run test:coverage

# Typecheck
npm run typecheck
```

## Banco de Dados

Tabelas principais no Supabase:

- `patients` — Pacientes
- `health_insurers` — Operadoras de saude
- `medical_accounts` — Contas medicas
- `procedures` — Procedimentos
- `glosas` — Glosas e recursos
- `payments` — Pagamentos
- `digital_certificates` — Certificados digitais
- `sus_bpa` — Boletins de Producao Ambulatorial
- `sus_aih` — Autorizacoes de Internacao
- `sus_procedures` — Tabela SIGTAP
- `audit_logs` — Logs de auditoria
- `notifications` — Notificacoes

## Licenca

Privado. Todos os direitos reservados.
