# Sprint 02 — URL Hardening, CORS Fixes & RBAC Completion

**Status:** In Progress
**Started:** 2026-03-17
**Owner:** Ferid + Ranim

---

## Objectives

1. Eliminate all hardcoded localhost URLs that break production
2. Tighten CORS so development origins never leak into production builds
3. Close RBAC gaps where routes had weaker guards than intended
4. Fix two critical env-var bugs causing broken emails and broken image uploads
5. Align frontend auth cache invalidation with the TanStack Query architecture

---

## Audit Findings Summary

### Critical Bugs (broken functionality in production)

| # | Location | Bug |
|---|----------|-----|
| C1 | `authController.js:26` | `BACKEND_URL` env var used but never defined → every activation email contains `undefined/api/auth/activate?token=…` |
| C2 | `userController.js:13-17` | First `cloudinary.config()` block uses `CLOUDINARY_NAME/KEY/SECRET` (undefined) instead of `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` — duplicate call, wrong var names |
| C3 | `userController.js:155` | Profile image URL hardcoded to `http://localhost:4001/uploads/…` — broken behind nginx in production |

### Security / CORS Issues

| # | Location | Issue |
|---|----------|-------|
| S1 | `app.js:54-57` | `http://localhost:3000` always in `allowedOrigins`, even in production |
| S2 | `app.js:39` | CSP `imgSrc` hardcodes `http://localhost:4001` in all environments |
| S3 | `authController.js` (4 locations) | Cookie `sameSite: "lax"` in production; should be `"strict"` when frontend and backend share `nexa-tn.com` domain |

### RBAC Gaps

| # | Route | Missing Guard |
|---|-------|--------------|
| R1 | `PUT /api/packs/:id` | Only `requireAuth` — needs `requireAdmin` |
| R2 | `DELETE /api/packs/:id` | Only `requireAuth` — needs `requireAdmin` |
| R3 | `POST /api/auth/logout` | No auth guard → refresh token NOT cleared from DB |
| R4 | `POST /api/tickets/tickets/:id/status` | Any authenticated user can close any ticket |
| R5 | `GET /api/users/demandes/en-attente` | Admin-only operation, only `requireAuth` |

### Frontend Issues

| # | Location | Issue |
|---|----------|-------|
| F1 | `api.ts:40` | `localStorage.removeItem("user")` — AuthContext never used localStorage; should clear TanStack cache |
| F2 | `App.tsx:157` | `*` fallback redirects to `/dashboard` (role-gated) → double redirect for wrong-role users |

### Environment / Infrastructure

| # | Location | Issue |
|---|----------|-------|
| E1 | `docker-compose.dev.yml:9` | Backend port bound to `0.0.0.0:4001` (all interfaces) in dev |
| E2 | `Ecommerce/Dockerfile:8` | Default `VITE_API_URL=http://localhost:4001/api` baked in → silent misconfiguration if build arg not passed |
| E3 | `backend/.env.example` | Missing `BACKEND_URL` documentation |

---

## Sub-Sprint Breakdown

### Sub-Sprint 1 — Critical Bug Fixes
**Files:** `authController.js`, `userController.js`

- Fix `BACKEND_URL` → `FRONTEND_URL` in activation email link
- Remove duplicate broken Cloudinary config block (wrong var names)
- Fix profile image URL to use env var instead of hardcoded localhost

### Sub-Sprint 2 — CORS & Security Headers
**Files:** `app.js`, `authController.js`

- CORS: gate `http://localhost:3000` behind `NODE_ENV !== 'production'`
- CSP `imgSrc`: gate `http://localhost:4001` behind `NODE_ENV !== 'production'`
- Cookies: `sameSite: "strict"` in production, `"lax"` in development

### Sub-Sprint 3 — RBAC Route Guard Completion
**Files:** `packsRoutes.js`, `auth.js`, `ticketsRoutes.js`, `userRoutes.js`

- `PUT/DELETE /packs/:id` → add `requireAdmin`
- `POST /auth/logout` → add `requireAuth`
- `POST /tickets/tickets/:id/status` → add `requireRole('admin', 'specialiste')`
- `GET /users/demandes/en-attente` → add `requireAdmin`

### Sub-Sprint 4 — Frontend & Infrastructure
**Files:** `api.ts`, `main.tsx`, `App.tsx`, `docker-compose.dev.yml`, `Dockerfile`, `.env.example`

- Create `src/lib/queryClient.ts` singleton (avoids circular dep)
- Update `main.tsx` to import from singleton
- `api.ts`: replace `localStorage.removeItem("user")` with `queryClient.removeQueries({ queryKey: ['me'] })`
- `App.tsx`: `*` fallback → redirect to `/` not `/dashboard`
- `docker-compose.dev.yml`: bind dev port to `127.0.0.1`
- `Dockerfile`: remove default `VITE_API_URL` value (fail loudly)
- `.env.example`: document `BACKEND_URL`

---

## VPS `.env` Changes Required

Add to `/var/www/nexa-tn/.env` on the VPS (Ranim to add):

```env
NODE_ENV=production
BACKEND_URL=https://nexa-tn.com
```

Verify these are already present (required by other fixes):

```env
FRONTEND_URL=https://nexa-tn.com
JWT_SECRET=<strong-secret>
```

---

## Risk Matrix

| Change | Risk | Mitigation |
|--------|------|-----------|
| BACKEND_URL fix | Very Low | Direct substitution, same domain |
| Cloudinary config dedup | Very Low | Remove dead code only |
| CORS production gate | Medium | Requires `NODE_ENV=production` on VPS — verify before deploy |
| Cookie sameSite strict | Medium | Test login flow end-to-end after deploy |
| requireAdmin on packs | Low | Breaks only unauthorized access (intentional) |
| requireAuth on logout | Low | Frontend silently catches 401, redirect still fires |
| requireRole on ticket status | Low | Confirm no vendeur UI calls this route directly |
| queryClient singleton | Medium | Small structural refactor — run `npm run build` to verify |

---

## Testing Checklist

### Backend
- [ ] `POST /api/auth/register-vendeur` → activation email link starts with `https://nexa-tn.com/api/auth/activate`
- [ ] `POST /api/users/me/upload` → `image_url` in response starts with `https://nexa-tn.com/uploads/`
- [ ] `OPTIONS /api/auth/login` from `https://nexa-tn.com` → `Access-Control-Allow-Origin: https://nexa-tn.com`
- [ ] `OPTIONS /api/auth/login` from `http://localhost:3000` in production → 403 CORS
- [ ] `PUT /api/packs/1` as vendeur → 403
- [ ] `DELETE /api/packs/1` as vendeur → 403
- [ ] `POST /api/auth/logout` without token → 401
- [ ] `POST /api/tickets/tickets/1/status` as vendeur → 403
- [ ] `GET /api/users/demandes/en-attente` as vendeur → 403
- [ ] Login response cookie: `SameSite=Strict` in production, `SameSite=Lax` in dev

### Frontend
- [ ] Session expiry → TanStack `['me']` cache cleared → redirect to `/auth/login`
- [ ] Navigate to unknown URL → redirected to `/` (homepage), not `/dashboard`
- [ ] `npm run build` passes with no TypeScript errors
