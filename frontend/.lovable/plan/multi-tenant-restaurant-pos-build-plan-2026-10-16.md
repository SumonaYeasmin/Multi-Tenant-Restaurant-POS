# Multi-Tenant Restaurant POS — Build Plan

A frontend-only prototype with realistic mock data for multiple restaurants, built in stages so the app works after each one. No subscription purchasing screens; only an "is this restaurant active?" check with mock active/inactive states.

## Non-negotiables (confirmed)
- Redux Toolkit + RTK Query everywhere; no Zustand; server data lives only in the RTK Query cache, never copied into slices.
- Frontend-only: realistic mock services, no real backend, database, or auth provider.
- Every mock record is scoped by tenant ID and every service call filters by the active tenant, so restaurants never see each other's data.
- Tenant branding, branch switching, role-based UI permissions, and activation guards are all in Stage 1.
- No subscription purchasing, pricing, billing-plan, or renewal screens.
- Stage 1 is built completely and its full workflow is checked in the browser before Stage 2 starts. All four stages are kept.
- Modular, strictly typed, accessible; services are shaped like REST endpoints so a real API can replace them later.

## One required deviation from the brief
This project runs on TanStack Router (file-based routes), which cannot be swapped for React Router. All routing goals in the brief — nested layouts, auth / tenant / activation / permission guards, lazy-loaded modules, 404s, `/app/:tenantSlug/...` URLs — are delivered with TanStack Router instead. Everything else follows the brief: Redux Toolkit + RTK Query (no Zustand), Tailwind, shadcn/ui, React Hook Form + Zod, Recharts, date-fns, Sonner, TanStack Table.

## Design direction
Light-first, data-dense operations UI: warm neutral surfaces, thin borders, one tenant accent color (driven by CSS variables so each restaurant's branding swaps live), dark mode toggle. Distinctive but restrained typography (e.g. Manrope headings / IBM Plex Sans body, mono for prices and order numbers).

## Stages

**Stage 1 — Foundation and core loop** (this first build)
- Typed store, slices (tenant, branch, cart, UI, theme), centralized RTK Query API backed by a mock service layer with latency and tenant-scoped localStorage persistence.
- 3 demo restaurants with distinct branding, branches, menus, staff; demo users per role (owner, manager, cashier, kitchen, waiter).
- Login, forgot/reset password, invitation, workspace select, inactive workspace, access denied.
- App shell: sidebar (branch selector, role-aware groups, collapse), topbar (breadcrumbs, search, notifications, theme toggle, profile).
- End-to-end flow: POS (variants, modifiers, discounts, order types, totals) → Kitchen Display (new → preparing → ready) → Orders + detail → Payment (cash/card/split mock) → printable receipt → inventory deduction → dashboard numbers update.
- Tables/floor plan with live status.

**Stage 2 — Menu, inventory, purchasing**
Categories, items, modifiers, combos; stock levels, adjustments, movements, counts; recipes and food cost; suppliers, purchase orders, receiving, returns.

**Stage 3 — People and money**
Customers and loyalty, reservations, delivery, payments, refunds, cash management and shift reconciliation, expenses, staff, roles and permissions, shifts and attendance, branches, promotions.

**Stage 4 — Insight and admin**
Sales / financial / inventory / operations reports with filters and charts, notifications, audit logs, integrations (simulated), all settings pages including tenant branding and theme customization, README.

Each stage ends with a check that every visible button works and pages have loading, empty and error states.

## Technical details
- Feature folders under `src/features/<module>/` (api endpoints, slices, components, types); shared UI in `src/components/`; config in `src/config/` (navigation, permissions, feature flags); store in `src/app/`.
- Routes: `src/routes/app.$tenantSlug.tsx` layout with guards in `beforeLoad`, children like `app.$tenantSlug.pos.tsx`, `app.$tenantSlug.orders.$orderId.tsx`, `app.$tenantSlug.settings.*`.
- Mock services expose async functions shaped like future REST calls; RTK Query uses a `fakeBaseQuery`/queryFn adapter so swapping to a real backend means replacing only the base query.
- Activation checked via an `activationService` interface; mock returns active/inactive/grace per tenant.
- Only non-sensitive prefs persisted; no passwords stored.
