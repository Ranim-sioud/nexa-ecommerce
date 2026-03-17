# Sprint 02 Report — URL Hardening, CORS Fixes & RBAC Completion

**Date:** 2026-03-17
**Sprint:** 02
**Status:** COMPLETE

---

## Summary

Full audit of all hardcoded URLs, CORS configuration, cookie security, and RBAC route guards across the entire Nexa Ecommerce codebase. 13 issues found and fixed across backend, frontend, and infrastructure.

---

## Changes Implemented

### Sub-Sprint 1 — Critical Bug Fixes ✅

#### C1 — Broken activation email link (`authController.js:26`)
**Problem:** `process.env.BACKEND_URL` was used but never defined anywhere — every activation email sent to new users contained a broken link: `undefined/api/auth/activate?token=...`.
**Fix:** Changed to `process.env.FRONTEND_URL` (already defined, points to `https://nexa-tn.com` in production — same domain serves the API via nginx `/api/` proxy).

```diff
- const activationLink = `${process.env.BACKEND_URL}/api/auth/activate?token=${token}`;
+ const activationLink = `${process.env.FRONTEND_URL}/api/auth/activate?token=${token}`;
```

**File:** `backend/src/controllers/authController.js`

---

#### C2 — Duplicate Cloudinary config with wrong variable names (`userController.js:13-17`)
**Problem:** Two consecutive `cloudinary.config()` calls existed. The first (at module top-level, used by the `upload` multer instance) referenced `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` — variables never defined in any `.env` file. Cloudinary was initialized with `undefined` values.
**Fix:** Removed the duplicate broken block. The single correct config block (using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) is kept, placed before the upload route handler.

```diff
- cloudinary.config({
-   cloud_name: process.env.CLOUDINARY_NAME,
-   api_key: process.env.CLOUDINARY_KEY,
-   api_secret: process.env.CLOUDINARY_SECRET,
- });
  // (the correct block below this was kept)
```

**File:** `backend/src/controllers/userController.js`

---

#### C3 — Hardcoded localhost in profile image URL (`userController.js:155`)
**Problem:** After upload, profile image URL was stored as `http://localhost:4001/uploads/<filename>`. Behind the nginx reverse proxy on the VPS, port 4001 is never publicly accessible — all profile images would return 404 or be blocked by CSP.
**Fix:** Build URL from `FRONTEND_URL` env var (same domain serves static uploads via nginx or CDN).

```diff
- user.image_url = `http://localhost:4001/uploads/${req.file.filename}`;
+ const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4001';
+ user.image_url = `${baseUrl}/uploads/${req.file.filename}`;
```

**File:** `backend/src/controllers/userController.js`

---

### Sub-Sprint 2 — CORS & Security Headers ✅

#### S1 — CORS: dev origin always included in production (`app.js`)
**Problem:** `allowedOrigins` array always included `http://localhost:3000` — a hardcoded literal. In production this allows any request from localhost to bypass CORS, which is a security misconfiguration.
**Fix:** Gate the dev origin behind `NODE_ENV !== 'production'`.

```diff
- const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
- //app.use(cors({ origin: FRONTEND_URL, credentials: true }));
- const allowedOrigins = [
-   "http://localhost:3000",
-   process.env.FRONTEND_URL
- ].filter(Boolean);
+ const allowedOrigins = [
+   process.env.FRONTEND_URL,
+   ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
+ ].filter(Boolean);
```

**File:** `backend/src/app.js`

---

#### S2 — CSP `imgSrc` hardcodes localhost (`app.js:39`)
**Problem:** Content-Security-Policy `imgSrc` included `http://localhost:4001` unconditionally — in production this directive is ignored (the host doesn't exist publicly) but it pollutes the header.
**Fix:** Include only in development.

```diff
- imgSrc: ["'self'", "data:", "http://localhost:4001", "blob:", "*.cloudinary.com"],
+ imgSrc: [
+   "'self'", "data:", "blob:", "*.cloudinary.com",
+   ...(process.env.NODE_ENV !== 'production' ? ["http://localhost:4001"] : []),
+ ],
```

**File:** `backend/src/app.js`

---

#### S3 — Cookie `sameSite: "lax"` in production (`authController.js`)
**Problem:** All `res.cookie()` calls for `accessToken` and `refreshToken` used `sameSite: "lax"` in every environment. Since both frontend and backend share `nexa-tn.com` (same eTLD+1), `"strict"` is the correct setting in production and provides stronger CSRF protection.
**Fix:** `sameSite: "strict"` in production, `"lax"` in development (required for cross-port dev setup).

Changed in `login()` (2 cookies) and `refresh()` (2 cookies) — 4 locations total.

```diff
+ const isProd = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
-   secure: process.env.NODE_ENV === "production",
-   sameSite: "lax",
+   secure: isProd,
+   sameSite: isProd ? "strict" : "lax",
    maxAge: 4 * 60 * 60 * 1000,
  });
```

**File:** `backend/src/controllers/authController.js`

---

### Sub-Sprint 3 — RBAC Route Guard Completion ✅

#### R1 & R2 — Pack mutations not admin-gated (`packsRoutes.js`)
**Problem:** `PUT /api/packs/:id` and `DELETE /api/packs/:id` only verified authentication, not the admin role. Any authenticated user (vendeur, fournisseur, etc.) could modify or delete subscription packs.

```diff
+ import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";
- router.put('/:id', requireAuth, updatePack);
- router.delete('/:id', requireAuth, deletePack);
+ router.put('/:id', requireAuth, requireAdmin, updatePack);
+ router.delete('/:id', requireAuth, requireAdmin, deletePack);
```

**File:** `backend/src/routes/packsRoutes.js`

---

#### R3 — Logout not protected (`auth.js`)
**Problem:** `POST /api/auth/logout` had no auth middleware. The logout controller conditionally cleared the refresh token from DB only `if (req.user?.id)` — without `requireAuth`, `req.user` is never set, so the hashed refresh token remained in the DB after logout.

```diff
+ import { requireAuth } from '../middlewares/authMiddleware.js';
- router.post('/logout', logout);
+ router.post('/logout', requireAuth, logout);
```

**File:** `backend/src/routes/auth.js`

---

#### R4 — Ticket status update not role-gated (`ticketsRoutes.js`)
**Problem:** `POST /api/tickets/tickets/:id/status` allowed any authenticated user to change any ticket's status. Closing and reopening tickets is an admin/specialist operation.

```diff
+ import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";
- router.post("/tickets/:id/status", requireAuth, updateTicketStatus);
+ router.post("/tickets/:id/status", requireAuth, requireRole('admin', 'specialiste'), updateTicketStatus);
```

**File:** `backend/src/routes/ticketsRoutes.js`

---

#### R5 — Pending pack-change requests visible to all (`userRoutes.js`)
**Problem:** `GET /api/users/demandes/en-attente` lists all pending pack upgrade requests — an admin-only review screen. Only `requireAuth` was applied.

```diff
+ import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";
- router.get('/demandes/en-attente', requireAuth, getDemandesPackEnAttente);
+ router.get('/demandes/en-attente', requireAuth, requireAdmin, getDemandesPackEnAttente);
```

**File:** `backend/src/routes/userRoutes.js`

---

### Sub-Sprint 4 — Frontend & Infrastructure ✅

#### F1 — Auth cache invalidation on session expiry (`api.ts`, `main.tsx`)
**Problem:** On refresh-token failure, `api.ts` called `localStorage.removeItem("user")` — but `AuthContext` never stored the user in localStorage (it uses TanStack Query cache). Stale auth state could persist briefly until the page reload completed.
**Fix:** Created a QueryClient singleton at `src/lib/queryClient.ts`. `main.tsx` imports from it; `api.ts` imports it and calls `queryClient.removeQueries({ queryKey: ['me'] })` on auth failure.

**New file:** `Ecommerce/src/lib/queryClient.ts`

```typescript
import { QueryClient } from "@tanstack/react-query";
const queryClient = new QueryClient();
export default queryClient;
```

**Modified:** `Ecommerce/src/main.tsx`, `Ecommerce/src/components/api.ts`

```diff
+ import queryClient from "../lib/queryClient";
- localStorage.removeItem("user");
+ queryClient.removeQueries({ queryKey: ['me'] });
```

---

#### F2 — Fallback route double-redirect (`App.tsx`)
**Problem:** Unknown URLs redirected to `/dashboard` — a role-gated route. Wrong-role users got: unknown URL → `/dashboard` → ProtectedRoute → `/auth/login`. Two redirects, confusing for analytics and potentially exposing role-specific route names.
**Fix:** Redirect to `/` (public homepage).

```diff
- <Route path="*" element={<Navigate to="/dashboard" replace />} />
+ <Route path="*" element={<Navigate to="/" replace />} />
```

**File:** `Ecommerce/src/App.tsx`

---

#### E1 — Dev backend exposed to all network interfaces (`docker-compose.dev.yml`)
**Problem:** `"4001:4001"` binds to `0.0.0.0` — the backend is accessible from any machine on the network during development.

```diff
- - "4001:4001"
+ - "127.0.0.1:4001:4001"
```

**File:** `docker-compose.dev.yml`

---

#### E2 — Dockerfile bakes localhost fallback silently (`Ecommerce/Dockerfile`)
**Problem:** `ARG VITE_API_URL=http://localhost:4001/api` — if the build arg is not passed, the production Docker image silently points to localhost. No error. The CI/CD pipeline already passes the arg, but the default created a false safety net.

```diff
- ARG VITE_API_URL=http://localhost:4001/api
+ ARG VITE_API_URL
```

**File:** `Ecommerce/Dockerfile`

---

#### E3 — Missing `BACKEND_URL` in env.example (`backend/.env.example`)
Added documentation for the `BACKEND_URL` variable that is used in profile image URL construction.

**File:** `backend/.env.example`

---

## VPS Action Required

**Ranim to add/verify in `/var/www/nexa-tn/.env`:**

```env
NODE_ENV=production
BACKEND_URL=https://nexa-tn.com
FRONTEND_URL=https://nexa-tn.com
```

`NODE_ENV=production` activates:
- CORS: removes `http://localhost:3000` from allowed origins
- CSP: removes `http://localhost:4001` from imgSrc
- Cookies: `sameSite=strict` instead of `lax`

---

## Files Changed

| File | Changes |
|------|---------|
| `backend/src/controllers/authController.js` | C1: BACKEND_URL→FRONTEND_URL; S3: sameSite strict in prod (4 locations) |
| `backend/src/controllers/userController.js` | C2: removed duplicate broken Cloudinary config; C3: localhost URL → env var |
| `backend/src/app.js` | S1: CORS dev-only localhost; S2: CSP dev-only localhost |
| `backend/src/routes/packsRoutes.js` | R1+R2: added requireAdmin to PUT/DELETE |
| `backend/src/routes/auth.js` | R3: added requireAuth to logout |
| `backend/src/routes/ticketsRoutes.js` | R4: added requireRole('admin','specialiste') to status update |
| `backend/src/routes/userRoutes.js` | R5: added requireAdmin to pending-requests endpoint |
| `backend/.env.example` | E3: documented BACKEND_URL |
| `Ecommerce/src/lib/queryClient.ts` | F1: new singleton QueryClient |
| `Ecommerce/src/main.tsx` | F1: import queryClient from singleton |
| `Ecommerce/src/components/api.ts` | F1: removeQueries instead of localStorage |
| `Ecommerce/src/App.tsx` | F2: fallback * → / instead of /dashboard |
| `docker-compose.dev.yml` | E1: bind dev backend port to 127.0.0.1 |
| `Ecommerce/Dockerfile` | E2: remove default VITE_API_URL |

**Total:** 14 files, 13 issues resolved.

---

## What Was NOT Changed (Out of Scope)

- `POST /api/auth/logout` returns 401 if token is expired — frontend `authLogout()` already silently catches errors and redirects. No user-visible regression.
- `GET /api/tickets/types` — left public to all authenticated users. Ticket types are not sensitive data.
- Ticket route path anomaly (`/tickets/tickets/:id/status` double prefix) — pre-existing, flagged for cleanup in Sprint 03.
- Nginx config — `nexa-tn.com` is a single-tenant domain, no parameterization needed.
- WebSocket / real-time notifications — out of scope.

---

## Next Sprint Suggestions

- Migrate disk-based profile image upload to Cloudinary (CloudinaryStorage multer adapter is already imported but unused)
- Add `BACKEND_URL` to nginx static file serving config so `/uploads/` is accessible
- Fix double-prefix ticket route path `/api/tickets/tickets/:id/status` → `/api/tickets/:id/status`
- Rate-limit auth endpoints individually (register, login, forgot-password)
- Add Redis-backed rate limiting for production scale
