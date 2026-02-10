# Frontend & UX Specification

**Project:** FinHealth - Sistema de Gestao Financeira de Saude
**Phase:** Brownfield Discovery - Phase 3 (Frontend/UX)
**Date:** 2026-02-08
**Agent:** @ux-design-expert

---

## 1. Design System

### 1.1 Color Tokens (HSL via CSS Variables)

The design system uses HSL CSS custom properties consumed through Tailwind's `hsl(var(--token))` pattern. This enables seamless light/dark theme switching via the `.dark` class.

#### Light Theme (`:root`)

| Token | HSL Value | Role |
|-------|-----------|------|
| `--background` | 210 40% 98% | Page background (near-white blue tint) |
| `--foreground` | 222 47% 11% | Primary text (near-black) |
| `--card` | 0 0% 100% | Card surface (pure white) |
| `--card-foreground` | 222 47% 11% | Card text |
| `--popover` | 0 0% 100% | Popover surface |
| `--primary` | 224 76% 40% | Brand color (deep blue) |
| `--primary-foreground` | 210 40% 98% | Text on primary |
| `--secondary` | 210 40% 96% | Secondary surfaces |
| `--muted` | 210 40% 96% | Muted backgrounds |
| `--muted-foreground` | 215 16% 47% | Subtle text |
| `--accent` | 210 40% 96% | Accent surfaces |
| `--destructive` | 0 72% 51% | Error/danger (red) |
| `--border` | 214 32% 91% | Borders |
| `--input` | 214 32% 91% | Input borders |
| `--ring` | 224 76% 40% | Focus rings |
| `--radius` | 0.75rem (12px) | Base border radius |

#### Dark Theme (`.dark`)

| Token | HSL Value | Adjustment |
|-------|-----------|------------|
| `--background` | 222 47% 6% | Very dark navy |
| `--foreground` | 210 40% 98% | Light text |
| `--card` | 222 47% 8% | Slightly lighter card |
| `--primary` | 224 76% 48% | Brightened blue (+8% lightness) |
| `--secondary` | 217 33% 14% | Dark secondary |
| `--muted` | 217 33% 14% | Dark muted |
| `--muted-foreground` | 215 20% 55% | Brighter muted text |
| `--destructive` | 0 62% 45% | Dimmed red (-10% saturation) |
| `--border` | 217 33% 17% | Dark borders |

#### Chart Palette (5 colors)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--chart-1` | 224 76% 48% | 224 76% 55% | Primary data (blue) |
| `--chart-2` | 162 63% 41% | 162 63% 48% | Secondary data (teal) |
| `--chart-3` | 38 92% 50% | 38 92% 55% | Tertiary data (amber) |
| `--chart-4` | 280 65% 60% | 280 65% 65% | Quaternary data (purple) |
| `--chart-5` | 12 76% 61% | 12 76% 65% | Quinary data (coral) |

#### Sidebar-Specific Tokens

Separate tokens for sidebar background, foreground, border, accent, accent-foreground, and ring allow independent sidebar theming.

### 1.2 Typography

| Property | Value |
|----------|-------|
| Font Family (Sans) | Geist Sans (variable font, 100-900 weight) |
| Font Family (Mono) | Geist Mono (variable font, 100-900 weight) |
| CSS Variable | `--font-geist-sans`, `--font-geist-mono` |
| Font Loading | `next/font/local` with WOFF variable fonts |
| Body Rendering | `antialiased` + `font-feature-settings: "rlig" 1, "calt" 1` |
| Print Font Size | 12pt |

**Text Scale (Tailwind defaults):**

| Class | Size | Usage |
|-------|------|-------|
| `text-[10px]` | 10px | Mobile nav labels |
| `text-xs` | 12px | Badges, timestamps, secondary info |
| `text-sm` | 14px | Body text, nav items, form labels |
| `text-base` | 16px | Paragraphs (rare, mostly sm used) |
| `text-lg` | 18px | Section titles, logo text |
| `text-xl`-`text-4xl` | 20-36px | Page headings, KPI values |

### 1.3 Spacing

The layout uses Tailwind's default spacing scale with these dominant patterns:

| Pattern | Values | Context |
|---------|--------|---------|
| Page padding | `p-4 sm:p-6 lg:p-8` | Responsive main content |
| Card padding | `p-4` to `p-6` | Card content areas |
| Nav item padding | `px-3 py-2.5` | Sidebar links |
| Gap between items | `gap-1.5` to `gap-3` | Icon + label, breadcrumbs |
| Section spacing | `space-y-0.5` | Nav item vertical rhythm |
| Grid gap | `gap-4` to `gap-6` | Dashboard cards, form grids |

### 1.4 Border Radius

| Tailwind Class | Resolved Value | Usage |
|----------------|----------------|-------|
| `rounded-sm` | `calc(0.75rem - 4px)` = 8px | Small elements |
| `rounded-md` | `calc(0.75rem - 2px)` = 10px | Mid-size elements |
| `rounded-lg` | `0.75rem` = 12px | Buttons, cards, nav items |
| `rounded-full` | 9999px | Badges, avatars, notification dots |

### 1.5 Shadows

| Pattern | Usage |
|---------|-------|
| `shadow-sm` | Buttons (default, destructive, outline, secondary) |
| `shadow-lg` | Keyboard shortcuts help button |
| `shadow-xl` | Keyboard shortcuts overlay card |
| `shadow-none` | Badges (explicit removal) |
| Print: `box-shadow: none !important` | All elements in print |

### 1.6 Transitions & Animations

| Animation | Properties | Duration | Usage |
|-----------|------------|----------|-------|
| Nav hover | `transition-all` | 200ms | Sidebar links, buttons |
| Sidebar collapse | `transition-all` | 300ms | Sidebar width change |
| Button press | `active:scale-[0.98]` | Instant | Micro-interaction feedback |
| Theme icon | `rotate` + `scale` | CSS transition | Sun/Moon swap animation |
| Chevron rotate | `transition-transform` | 200ms | Sidebar expand/collapse arrows |
| Shortcuts card | `animate-in fade-in slide-in-from-bottom-2` | 200ms | Card entrance |
| Skeleton pulse | `animate-pulse` | Default | Loading states |
| Plugin | `tailwindcss-animate` | Various | Radix UI animations |

---

## 2. Component Library

### 2.1 UI Primitives (shadcn/ui + Radix)

All primitives use CVA (class-variance-authority) for variant management and `cn()` for class merging.

#### Button

**File:** `src/components/ui/button.tsx`

| Variant | Visual | Active State |
|---------|--------|-------------|
| `default` | `bg-primary text-primary-foreground shadow-sm` | `active:scale-[0.98]` |
| `destructive` | `bg-destructive text-destructive-foreground shadow-sm` | `active:scale-[0.98]` |
| `outline` | `border border-input bg-background shadow-sm` | `active:scale-[0.98]` |
| `secondary` | `bg-secondary text-secondary-foreground shadow-sm` | `active:scale-[0.98]` |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` | None |
| `link` | `text-primary underline-offset-4 hover:underline` | None |

| Size | Dimensions |
|------|-----------|
| `default` | `h-10 min-h-[2.75rem] px-4 py-2` |
| `sm` | `h-9 min-h-[2.25rem] px-3 text-xs` |
| `lg` | `h-11 min-h-[2.75rem] px-8` |
| `icon` | `h-10 w-10 min-h-[2.5rem]` |

- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Disabled: `disabled:pointer-events-none disabled:opacity-50`
- SVG: `[&_svg]:size-4 [&_svg]:shrink-0`
- Supports `asChild` via Radix `Slot`

#### Badge

**File:** `src/components/ui/badge.tsx`

| Variant | Visual |
|---------|--------|
| `default` | `bg-primary/10 text-primary` (subtle primary) |
| `secondary` | `bg-secondary text-secondary-foreground` |
| `destructive` | `bg-destructive/10 text-destructive` (subtle danger) |
| `outline` | `text-foreground` (border only) |

- Shape: `rounded-full`
- Size: `px-2.5 py-0.5 text-xs font-medium`
- Focus ring support included

#### Other UI Primitives

| Component | Source | Notes |
|-----------|--------|-------|
| `Card` / `CardHeader` / `CardTitle` / `CardContent` | shadcn/ui | Standard card composition |
| `Input` / `Label` | shadcn/ui | Form field primitives |
| `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` | shadcn/ui (Radix) | Dropdown select |
| `DropdownMenu` + sub-components | shadcn/ui (Radix) | User menu, notification menu |
| `Sheet` / `SheetContent` | shadcn/ui (Radix) | Mobile sidebar drawer |
| `Avatar` / `AvatarFallback` | shadcn/ui (Radix) | User initials (2-char) |
| `Toaster` + `toast()` | shadcn/ui | Toast notifications (hook-based) |
| `Skeleton` | shadcn/ui | Loading placeholder |
| `Table` / `TableHeader` / `TableRow` / `TableCell` | shadcn/ui | Data tables |
| `Dialog` / `DialogContent` | shadcn/ui (Radix) | Modal dialogs |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | shadcn/ui (Radix) | Tab navigation |
| `Checkbox` | shadcn/ui (Radix) | Bulk selection |

### 2.2 Domain Components

#### StatusBadge

**File:** `src/components/accounts/StatusBadge.tsx`

Maps `AccountStatus` enum to Badge variant + Portuguese label:

| Status | Label | Variant |
|--------|-------|---------|
| `pending` | Pendente | `secondary` |
| `validated` | Validada | `outline` |
| `sent` | Enviada | `default` |
| `paid` | Paga | `default` |
| `glosa` | Glosada | `destructive` |
| `appeal` | Em Recurso | `secondary` |

#### EmptyState

**File:** `src/components/ui/EmptyState.tsx`

Reusable empty state with: centered icon (in muted circle), title, description, optional action button (outline variant with `href`).

#### SearchAndFilters

Applied to table views: text search input + select dropdowns for status/type filtering + clear button.

### 2.3 Charting Components

Uses **Recharts** library with domain-specific chart components:

| Component | Chart Type | Data Source |
|-----------|-----------|-------------|
| `GlosasByReasonChart` | Bar chart | Glosa reasons aggregation |
| `PaymentTimelineChart` | Line chart | Payment history over time |
| `AccountsByStatusChart` | Pie chart | Account status distribution |
| `MonthlyRevenueChart` | Area chart | Monthly revenue trend |
| `ReportCharts` | Mixed | Report visualizations |

---

## 3. Layout Architecture

### 3.1 AppShell Structure

**File:** `src/components/layout/AppShell.tsx`

```
+--------------------------------------------------+
| [Skip Link] (sr-only, visible on focus)          |
+--------------------------------------------------+
| [Sidebar]  |  [Header - sticky top-0 z-30]      |
| (desktop)  |  [Breadcrumbs]                      |
| fixed left |  [Main Content - #main-content]     |
| z-40       |  (overflow-auto, responsive padding) |
|            |                                      |
| w-64 or    |  [MobileBottomNav - fixed bottom-0]  |
| w-[4.5rem] |  (md:hidden, z-50)                  |
+--------------------------------------------------+
| [KeyboardShortcutsHelp - fixed, z-50]            |
+--------------------------------------------------+
```

**Key behaviors:**
- Server-side hydration guard (`mounted` state prevents flash)
- Sidebar collapse state persisted via Zustand + localStorage
- Mobile drawer closes automatically on route change
- Main content padding: `p-4 pb-20 sm:p-6 sm:pb-6 md:pb-8 lg:p-8`
- Extra bottom padding on mobile (`pb-20`) for MobileBottomNav clearance

### 3.2 Sidebar

**File:** `src/components/layout/Sidebar.tsx`

| Feature | Implementation |
|---------|---------------|
| Position | `fixed left-0 top-0` with `z-40` |
| Width | Expanded: `w-64` (256px), Collapsed: `w-[4.5rem]` (72px) |
| Collapse toggle | ChevronLeft button with 180deg rotation |
| Transition | `transition-all duration-300` |
| Active state | `bg-primary/10 text-primary` |
| Hover state | `hover:bg-accent hover:text-foreground` |
| Expandable sections | ChevronDown with `rotate-180` animation |
| Sub-items | Indented with `border-l border-border/50` left border |
| Collapsed mode | Icons only, `title` attribute for tooltip |
| Auto-expand | Sections auto-expand if current path matches |
| ARIA | `aria-label="Navegacao principal"`, `aria-current="page"` |
| Scrollable | `overflow-y-auto` for long nav lists |

**Navigation Sections (8):**

| Section | Icon | Sub-items |
|---------|------|-----------|
| Dashboard | LayoutDashboard | None |
| Contas Medicas | FileText | Listagem, Nova Conta |
| Glosas | AlertCircle | Painel, Por Operadora, Faturamento |
| Pagamentos | CreditCard | Painel, Conciliacao, Inadimplencia |
| TISS | Upload | Guias, Upload, Validacao, Lotes, Certificados |
| SUS | Building2 | BPA, AIH, SIGTAP, Remessa |
| Relatorios | BarChart3 | None |
| Configuracoes | Settings | Geral, Usuarios, Operadoras, Pacientes, Auditoria |

### 3.3 Header

**File:** `src/components/layout/Header.tsx`

| Feature | Implementation |
|---------|---------------|
| Position | `sticky top-0 z-30` |
| Height | `h-14` mobile, `h-16` desktop |
| Background | `bg-background/95 backdrop-blur-sm` (frosted glass) |
| Left side | Mobile menu button (md:hidden), subtitle text (sm:block) |
| Right side | ThemeToggle, NotificationDropdown, User Avatar Menu |
| User menu | Email display, Perfil link, Sair button |
| Sign out | Supabase `auth.signOut()` with error toast |

### 3.4 Breadcrumbs

**File:** `src/components/layout/Breadcrumbs.tsx`

| Feature | Implementation |
|---------|---------------|
| Auto-generated | From `pathname` segments |
| Home icon | Lucide `Home` (4x4) with sr-only label |
| Separator | ChevronRight (3.5x3.5) |
| Current page | `font-medium text-foreground` + `aria-current="page"` |
| Ancestors | Clickable links with hover color |
| Hidden on | Dashboard root (`/dashboard`) |
| Label map | 30 Portuguese segment labels |
| Fallback | Capitalize first letter of unknown segments |

### 3.5 Mobile Bottom Navigation

**File:** `src/components/layout/MobileBottomNav.tsx`

| Feature | Implementation |
|---------|---------------|
| Visibility | `md:hidden` (visible below 768px only) |
| Position | `fixed bottom-0 left-0 right-0 z-50` |
| Loading | Dynamic import with `{ ssr: false }` |
| Layout | `flex items-center justify-around` |
| Label size | `text-[10px]` (10px) |
| Active state | `text-primary` |
| Items (5) | Home, Contas, Glosas, Pagam., Relat. |
| ARIA | `aria-label="Navegacao mobile"`, `aria-current="page"` |

---

## 4. Responsive Design

### 4.1 Breakpoints (Tailwind defaults)

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| Default | < 640px | Single column, mobile nav, p-4, h-14 header |
| `sm` (640px) | >= 640px | 2-col grids, p-6, subtitle visible, larger gaps |
| `md` (768px) | >= 768px | Sidebar visible, bottom nav hidden, desktop layout |
| `lg` (1024px) | >= 1024px | p-8 content padding, wider cards |
| `xl` (1280px) | >= 1280px | Max-width containers on some pages |

### 4.2 Responsive Patterns

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Sidebar | Sheet drawer (left) | Fixed sidebar |
| Navigation | Bottom tab bar (5 items) | Sidebar (8 sections) |
| Content padding | `p-4 pb-20` | `p-6` / `p-8` |
| Header height | `h-14` | `h-16` |
| Menu trigger | Hamburger button | Sidebar always visible |
| Form grids | 1 column | `sm:grid-cols-2` |
| Table overflow | Horizontal scroll | Full width |
| Dashboard cards | Stacked | `grid-cols-2` / `grid-cols-4` |
| Keyboard shortcuts button | `bottom-20` (above nav) | `bottom-4` |

---

## 5. Theming

### 5.1 Theme System

| Feature | Implementation |
|---------|---------------|
| Provider | `next-themes` via `ThemeProvider` |
| Strategy | CSS class (`.dark` on `<html>`) |
| Default | `system` (follows OS preference) |
| Options | `light`, `dark`, `system` |
| Persistence | `localStorage` (next-themes default) |
| Flash prevention | `suppressHydrationWarning` on `<html>` |
| Transition | `disableTransitionOnChange` (no flash during toggle) |

### 5.2 Theme Toggle

**File:** `src/components/theme-toggle.tsx`

- Ghost button with icon-only size
- Sun icon: `rotate-0 scale-100` in light, `-rotate-90 scale-0` in dark
- Moon icon: `rotate-90 scale-0` in light, `rotate-0 scale-100` in dark
- Uses `absolute` positioning for icon overlap animation
- ARIA label: "Alternar tema claro/escuro"

### 5.3 Dark Mode Adjustments

| Element | Light | Dark |
|---------|-------|------|
| Primary blue | 40% lightness | 48% lightness (+8%) |
| Destructive red | 72% saturation, 51% L | 62% saturation, 45% L |
| Muted foreground | 16% saturation, 47% L | 20% saturation, 55% L |
| Chart colors | Base | +5-7% lightness each |
| Borders | 91% lightness | 17% lightness |
| Cards | Pure white | 8% lightness |

---

## 6. Accessibility

### 6.1 Skip Link

**Location:** AppShell, first element in DOM

- `sr-only` by default, visible on `:focus`
- Target: `#main-content`
- Portuguese label: "Pular para o conteudo principal"
- Style: Primary background, rounded, z-50

### 6.2 ARIA Implementation

| Pattern | Implementation |
|---------|---------------|
| Navigation landmarks | `aria-label="Navegacao principal"` on sidebar nav |
| Mobile nav | `aria-label="Navegacao mobile"` |
| Breadcrumb | `aria-label="Breadcrumb"` on nav element |
| Current page | `aria-current="page"` on active nav links + breadcrumb |
| Decorative icons | `aria-hidden="true"` on all Lucide icons |
| Menu toggle | `aria-label="Abrir menu"` |
| Sidebar toggle | `aria-label="Expandir/Recolher menu lateral"` |
| Theme toggle | `aria-label="Alternar tema claro/escuro"` |
| Notifications | `aria-label="Notificacoes, N nao lidas"` (dynamic) |
| Shortcuts button | `aria-label="Atalhos de teclado"` + `aria-expanded` |
| User menu | `aria-label="Menu do usuario"` |
| Empty states | `role="status"` on notification empty state |

### 6.3 Keyboard Navigation

**File:** `src/hooks/useKeyboardShortcuts.ts`

| Shortcut | Action |
|----------|--------|
| `Alt + D` | Navigate to Dashboard |
| `Alt + C` | Navigate to Contas Medicas |
| `Alt + G` | Navigate to Glosas |
| `Alt + P` | Navigate to Pagamentos |
| `Alt + T` | Navigate to TISS |
| `Alt + R` | Navigate to Relatorios |
| `Alt + S` | Navigate to Configuracoes |
| `Escape` | Close dialogs, focus main content |

**Safety guards:**
- Ignored when focus is on `INPUT`, `TEXTAREA`, `SELECT`, or `contentEditable`
- Only fires with `altKey` (no Ctrl/Meta combination)

### 6.4 Keyboard Shortcuts Help

**File:** `src/components/layout/KeyboardShortcutsHelp.tsx`

- Floating `?` button (fixed position)
- Positioned `bottom-20 right-4` on mobile (above bottom nav), `bottom-4` on desktop
- Card overlay with all shortcuts in `<kbd>` elements
- Closes on: Escape key, click outside
- Focus returns to button on close
- `aria-expanded` state on trigger

### 6.5 Focus Management

| Pattern | Implementation |
|---------|---------------|
| Focus ring | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| Tab order | Natural DOM order, skip link as first |
| Escape handling | Returns focus to main content |
| Sheet dialog | Radix Dialog focus trap |
| Dropdown menus | Radix focus management |

### 6.6 Language & i18n

| Feature | Implementation |
|---------|---------------|
| HTML lang | `pt-BR` |
| i18n library | `next-intl` |
| Primary locale | pt-BR |
| Secondary locale | en |
| All UI text | Portuguese (hardcoded in components) |
| Date formatting | `pt-BR` locale via Intl.DateTimeFormat |
| Currency | BRL (R$) via formatCurrency helper |

---

## 7. Loading & Error States

### 7.1 Loading States

**Pattern:** Skeleton placeholders with `animate-pulse`

**Dashboard loading (`src/app/(dashboard)/loading.tsx`):**
- Header skeleton: rounded rectangle h-8 w-48
- KPI row: 4 skeleton cards (h-24 w-full)
- Content area: large skeleton block (h-64)
- Centered Loader2 spinner icon with `animate-spin`

**Page-level:** Each route group has dedicated `loading.tsx` with relevant skeleton shapes.

### 7.2 Error States

**Pattern:** Error boundary pages with retry action

**Standard error page structure:**
- AlertCircle icon in destructive color
- "Algo deu errado" heading
- Error message display
- "Tentar novamente" button calling `reset()`

**404 page (`src/app/not-found.tsx`):**
- Large "404" heading (text-9xl or similar)
- "Pagina nao encontrada" message
- "Voltar ao Dashboard" button linking to `/dashboard`

### 7.3 Empty States

**Pattern:** `EmptyState` component used across table views

- Contextual icon (e.g., FileText for accounts, AlertCircle for glosas)
- Portuguese description of what's missing
- Optional CTA button (e.g., "Criar primeira conta")

### 7.4 Toast Notifications

**Provider:** shadcn/ui Toaster (Radix Toast)

| Usage | Variant | Example |
|-------|---------|---------|
| Success | default | "Conta criada com sucesso" |
| Error | destructive | "Erro ao salvar" |
| Rate limit | destructive | "Muitas requisicoes. Aguarde..." |
| Sign out error | destructive | "Nao foi possivel encerrar a sessao" |

---

## 8. Notification System

### 8.1 In-App Notifications

**File:** `src/components/notifications/NotificationDropdown.tsx`

| Feature | Implementation |
|---------|---------------|
| Trigger | Bell icon button in Header |
| Unread badge | Red dot with count (capped at "9+") |
| Polling interval | 60 seconds |
| API endpoint | `GET /api/notifications` + `PATCH /api/notifications` |
| Max visible | 10 notifications in dropdown |
| Types | info, warning, error, success (each with Lucide icon) |
| Mark as read | Individual (click) or bulk ("Marcar todas como lidas") |
| Deep linking | Click navigates to `notification.href` if present |
| Relative time | `formatRelative()` helper |
| Empty state | "Nenhuma notificacao" centered text |
| Unread highlight | `bg-muted/50` background + blue dot indicator |

### 8.2 Push Notifications

- Web Push via VAPID keys
- Service Worker registration
- Server-side `sendPushNotification()` in `src/lib/push.ts`

### 8.3 Email Notifications

- Resend integration (`src/lib/email.ts`)
- 3 HTML email templates: glosa alert, payment confirmation, account status change

---

## 9. Form Patterns

### 9.1 Standard Form Pattern

Used across: CreateAccountForm, BpaForm, AihForm, and configuration forms.

```
Pattern: useState per field → fetch POST → toast → router.push
```

| Aspect | Implementation |
|--------|---------------|
| State management | `useState` per field (no form library) |
| Layout | `grid gap-4 sm:grid-cols-2` (responsive 2-column) |
| Labels | `<Label>` from shadcn/ui |
| Inputs | `<Input>` / `<Select>` from shadcn/ui |
| Validation | Zod schema on API side; client trusts API response |
| Submission | `fetch()` to `/api/*` with JSON body |
| Success | `toast()` success message + `router.push()` redirect |
| Error | `toast()` destructive with error details |
| Loading | Button disabled + "Salvando..." text |
| Back navigation | ArrowLeft link at page top |

### 9.2 Table Data Pattern

Used across: accounts, glosas, payments, TISS guides, SUS BPA/AIH, audit logs, users, patients, insurers.

| Feature | Implementation |
|---------|---------------|
| Server fetch | Supabase query in Server Component |
| Data table | shadcn/ui `Table` components |
| Sorting | Client-side with `useSortableTable` hook |
| Search | Text input filtering (client-side) |
| Filters | Select dropdowns for status/type |
| Bulk actions | Checkbox selection + batch operations |
| Empty state | `EmptyState` component |
| Row actions | Dropdown menu (view, edit, delete) |
| Pagination | Server-side via Supabase `.range()` |

### 9.3 Search & Filter Pattern

| Component | Purpose |
|-----------|---------|
| Text input | Full-text search across key fields |
| Status select | Filter by entity status |
| Type select | Filter by entity type |
| Date range | Filter by date period |
| Clear button | Reset all filters |

---

## 10. Print Styles

**File:** `src/app/globals.css` (`@media print`)

| Rule | Effect |
|------|--------|
| Hide nav/aside/footer/buttons | Non-essential UI removed |
| Hide `[role="navigation"]` | All nav landmarks |
| Hide `[aria-label="Navegacao principal"]` | Sidebar |
| Hide `[aria-label="Breadcrumb"]` | Breadcrumbs |
| Reset main layout | `margin: 0, padding: 0, width: 100%` |
| Body text | `12pt, color: #000, bg: #fff` |
| Table breaks | `page-break-inside: auto` (table), `avoid` (row) |
| Table headers | `display: table-header-group` (repeat on pages) |
| External links | Show URL after link text |
| Internal/anchor links | No URL shown |
| Borders | Light gray (`#ccc`) |
| Shadows | Removed entirely |

---

## 11. Navigation Architecture

### 11.1 Route Groups

| Group | Path Prefix | Auth Required | Layout |
|-------|-------------|---------------|--------|
| `(auth)` | `/login`, `/signup`, `/reset-password` | No | Minimal (centered card) |
| `(dashboard)` | All other routes | Yes | AppShell (sidebar + header) |

### 11.2 Page Inventory (66 pages across 8 modules)

| Module | Pages | Key Routes |
|--------|-------|------------|
| Dashboard | 3 | `/dashboard` (main + customizable widgets) |
| Contas Medicas | 4 | `/contas`, `/contas/nova`, `/contas/[id]` |
| Glosas | 5 | `/glosas`, `/glosas/operadora`, `/glosas/faturamento` |
| Pagamentos | 5 | `/pagamentos`, `/pagamentos/conciliacao`, `/pagamentos/inadimplencia` |
| TISS | 7 | `/tiss`, `/tiss/upload`, `/tiss/validacao`, `/tiss/lotes`, `/tiss/certificados` |
| SUS | 6 | `/sus/bpa`, `/sus/aih`, `/sus/sigtap`, `/sus/remessa` |
| Relatorios | 3 | `/relatorios` (PDF/Excel export) |
| Configuracoes | 7 | `/configuracoes`, `/configuracoes/usuarios`, etc. |
| Auth | 4 | `/login`, `/signup`, `/reset-password/*` |

### 11.3 Metadata

**Root layout metadata:**
- Title template: `%s | FinHealth`
- Default: "FinHealth - Gestao Financeira de Saude"
- OpenGraph: locale pt_BR, custom og-image.svg
- Robots: `noindex, nofollow` (private application)
- Manifest: `/manifest.json` (PWA support)
- Favicon: `/favicon.svg`

---

## 12. State Management

### 12.1 Client State (Zustand)

| Store | Persisted | Key State |
|-------|-----------|-----------|
| `ui-store` | Yes (localStorage) | `sidebarCollapsed: boolean` |
| `dashboard-store` | Yes (localStorage) | `widgets: Widget[]` (5 default widgets, draggable) |

### 12.2 Server State

- No client-side data cache (SWR/React Query not used)
- Data fetched server-side in Server Components via Supabase
- Real-time updates via `useRealtimeSubscription` hook (Supabase channels)
- Notifications polled every 60s via `setInterval`

### 12.3 Form State

- `useState` per field (no Formik/react-hook-form)
- No client-side validation library (Zod runs server-side only)
- Loading state managed per-form with `isSubmitting` boolean

---

## 13. Performance Patterns

| Pattern | Implementation |
|---------|---------------|
| Dynamic imports | `MobileBottomNav` loaded with `{ ssr: false }` |
| React.memo | Applied to heavy list components |
| Font optimization | `next/font/local` with variable fonts (single file each) |
| Image optimization | Next.js `<Image>` where used |
| Skeleton loading | Immediate visual feedback, no spinners |
| Route prefetching | Next.js `<Link>` default prefetching |
| Zustand persistence | `localStorage` (no server round-trips) |
| Backdrop blur | `backdrop-blur-sm` on header (GPU-accelerated) |

---

## 14. Findings & Recommendations

### 14.1 Critical

| # | Finding | Impact | Recommendation |
|---|---------|--------|----------------|
| C-1 | No client-side form validation | Users only see errors after server round-trip | Add Zod validation on client using the existing shared schemas before submission |
| C-2 | No data caching (SWR/TanStack Query) | Every navigation refetches from server; no optimistic updates | Evaluate adding TanStack Query for frequently accessed data with stale-while-revalidate |

### 14.2 Medium

| # | Finding | Impact | Recommendation |
|---|---------|--------|----------------|
| M-1 | Notification polling (60s interval) instead of Supabase Realtime | Delayed notifications, unnecessary network traffic | Migrate to Supabase Realtime subscription for notifications table |
| M-2 | No error boundaries per module | A single component error crashes entire page | Add React Error Boundaries per major section (forms, charts, tables) |
| M-3 | Hardcoded Portuguese text in components | i18n exists (next-intl) but most strings are inline | Migrate hardcoded strings to message files for consistent i18n |
| M-4 | Missing loading.tsx for some sub-routes | Navigating to sub-pages shows no loading feedback | Ensure every route leaf has a loading.tsx skeleton |
| M-5 | Charts bundle always loaded | Recharts adds ~40KB gzip to pages that use it | Dynamic import chart components only on pages that render them |
| M-6 | No responsive table solution | Tables with many columns scroll horizontally on mobile | Consider card-based layout for mobile table views |

### 14.3 Low

| # | Finding | Impact | Recommendation |
|---|---------|--------|----------------|
| L-1 | Sidebar width jump on hydration | Brief layout shift before `mounted` state resolves | Consider CSS-only initial state matching localStorage |
| L-2 | No focus-visible on Badge component | Badges with interactions may lack visible focus | Add `focus-visible:ring-2` to interactive badges |
| L-3 | MobileBottomNav shows only 5 of 8 sections | TISS, SUS, Configuracoes not accessible from bottom nav | Add "More" menu or prioritize by usage analytics |
| L-4 | No color contrast validation | HSL tokens may not meet WCAG AA (4.5:1) in all combinations | Audit contrast ratios especially muted-foreground on muted background |
| L-5 | No reduced-motion support | Animations play regardless of `prefers-reduced-motion` | Add `motion-reduce:` variants to animation classes |
| L-6 | Print styles don't handle chart SVGs | Charts may render poorly or be cut off in print | Add specific print handling for Recharts SVG elements |
| L-7 | Toast notifications lack aria-live | Screen readers may miss toast announcements | Verify Radix Toast uses `role="status"` or `aria-live="polite"` |

---

## 15. Summary

FinHealth's frontend is a well-structured Next.js 14 application with a consistent design system built on shadcn/ui and Tailwind CSS. The HSL-based token system enables clean light/dark theming. The layout is responsive with dedicated mobile navigation and a collapsible sidebar for desktop.

**Strengths:**
- Comprehensive ARIA implementation across navigation components
- Keyboard shortcuts for power users with help overlay
- Print stylesheet for report output
- Consistent component patterns (CVA variants, StatusBadge mapping)
- Skip link and semantic landmarks
- Zustand for minimal, persisted client state

**Key areas for improvement:**
- Client-side form validation (using existing Zod schemas)
- Data caching strategy (TanStack Query / SWR)
- Complete i18n migration (move hardcoded Portuguese to message files)
- Mobile table experience
- Accessibility contrast audit

---

*Generated by @ux-design-expert as part of AIOS Brownfield Discovery Workflow*
