<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Frontend-only prototype: all data comes from mock services in `src/services/*` backed by per-tenant stores in `src/mocks/db.ts`; no real backend. Why: the brief requires a swappable mock layer.
- Server data lives only in RTK Query (`src/app/api.ts`, `queryFn` + `run()` over `fakeBaseQuery`); Redux slices hold client state only (session id, active tenant/branch, cart draft, UI prefs). Why: avoid duplicating server state; swap to `fetchBaseQuery` later.
- `run()` structured-clones service results so frozen cache objects never alias mock records. Why: Immer freezes cached data.
- Every service takes `tenantId` first and reads only that tenant's store. Why: tenant isolation.
- Routing is TanStack Router (not React Router); tenant workspace lives under `src/routes/app.$tenantSlug.*`, guarded in `app.$tenantSlug.tsx` (session → membership → activation). Pages wrap content in `RequirePermission`. Why: platform router is fixed.
- Session/prefs are read from storage in effects only (client), never during SSR. Why: hydration safety.
- Tenant accent is applied by overriding `--primary` on the workspace wrapper. Why: live per-tenant branding.
- No Zustand, no subscription purchasing/pricing/renewal UI — activation is read-only via `ActivationProvider`.
- Every stock change goes through `applyMovement()` in `src/services/stock.service.ts` so on-hand quantity and the movement log never drift. Why: single audit trail for sales, purchases, counts, waste and returns.
- Back-office endpoints live in `src/features/backoffice/api.ts` (injected into the same `baseApi`); module pages use a layout route with `SubNav` + `<Outlet />` for sibling tabs. Why: keeps one API cache while splitting code by module.
- Mock DB has a `version`; bump `DB_VERSION` and add a migration in `tenantDb()` when the stored shape changes, preserving existing demo data. Why: testers keep their orders across releases.
- Stage 3 people & money endpoints live in `src/features/people/api.ts` over `people.service.ts` / `money.service.ts`; refunds, cash-drawer totals and promo validation are computed in services, never in UI. Why: one source of truth for money rules.
- Branches are stored per tenant in the mock DB (`db.branches`), not the static platform list. Why: branches are editable.
