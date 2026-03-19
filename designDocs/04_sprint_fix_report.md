# Sprint 04 — Fix Report (2026-03-19)

## Root Cause Analysis

### ERR_CONNECTION_REFUSED on `https://nexa-tn.com/api/*`

The frontend was built with `VITE_API_URL=https://nexa-tn.com/api` (absolute HTTPS URL).
The Nginx HTTP block only redirected `/` to HTTPS — it never proxied the API.
The HTTPS block requires SSL certificates that **haven't been installed yet**.

Result: browser loads the page over HTTP → tries API calls over HTTPS → port 443 refuses → `ERR_CONNECTION_REFUSED`.

---

## Fixes Applied

### 1. `VITE_API_URL` → relative `/api` (`docker-compose.yml`)

**Before:**
```yaml
VITE_API_URL: ${VITE_API_URL:-https://nexa-tn.com/api}
```
**After:**
```yaml
VITE_API_URL: ${VITE_API_URL:-/api}
```

A relative URL is resolved by the browser against the current page's origin. If the page loads over HTTP, API calls go HTTP. If HTTPS, they go HTTPS. No rebuild needed when switching to SSL.

---

### 2. `api.ts` — comment clarifying the pattern (`Ecommerce/src/components/api.ts`)

Added a comment explaining the fallback strategy:
- Docker/prod: `VITE_API_URL=/api` (relative, baked at build time)
- Local dev (no env): `http://localhost:4001/api` (fallback)

---

### 3. Nginx HTTP block now serves the full app (`nginx/nexa-tn.com.conf`)

**Before:** HTTP block only had ACME challenge + `return 301 https://...`

**After:** HTTP block proxies `/api/`, `/grafana/`, and `/` directly to containers — same as the HTTPS block.

The HTTPS block is now **commented out** — certbot will uncomment and configure it when SSL is installed.

```
DEPLOY SEQUENCE:
  1. Copy config → nginx -t → reload nginx   (site live on HTTP immediately)
  2. sudo certbot --nginx -d nexa-tn.com -d www.nexa-tn.com
  3. Certbot auto-adds HTTP→HTTPS redirect and activates the HTTPS block
```

---

### 4. `HomePage.tsx` — `navigate('/login')` → `navigate('/auth/login')`

Navbar "Connexion" button was navigating to `/login` which hits the `*` wildcard fallback and redirects back to `/`.

---

### 5. `Settings.tsx` — parrainage link URL

**Before:** `http://localhost:3000/auth/signup?code=...` (hardcoded, breaks in production)
**After:** `${window.location.origin}/auth/signup?code=...` (dynamic, works everywhere)

---

### 6. `AddProduct.tsx` — raw axios replaced with shared `api` instance

The file upload form used raw `axios` with `Authorization: Bearer ${localStorage.getItem("accessToken")}`.
The app uses **httpOnly cookies** — `accessToken` is never in localStorage, so every upload silently 401'd.

Fixed: uses `api` instance (cookie-based auth, correct `baseURL`).

---

### 7. `app.js` CORS — accepts http + https + www variants

**Before:** only `FRONTEND_URL` (e.g. `https://nexa-tn.com`) was allowed.
**After:** CORS function allows `http://nexa-tn.com`, `https://www.nexa-tn.com`, `http://www.nexa-tn.com` automatically.

---

### 8. `userController.js` — upload URL uses `BACKEND_URL`

**Before:** `process.env.FRONTEND_URL || 'http://localhost:4001'`
After: `process.env.BACKEND_URL || \`http://localhost:${process.env.PORT || 4001}\``

`FRONTEND_URL` is the user-facing domain — using it as the image base URL was wrong. `BACKEND_URL` is now exposed in docker-compose and defaults to `https://nexa-tn.com`.

---

## VPS Deploy Commands

```bash
# 1. Pull and rebuild
cd /path/to/nexa-ecommerce
git pull
docker compose up --build -d

# 2. Update nginx config
sudo cp nginx/nexa-tn.com.conf /etc/nginx/sites-available/nexa-tn.com
sudo nginx -t && sudo systemctl reload nginx

# 3. Verify site works on HTTP
curl -I http://nexa-tn.com/api/health

# 4. Install SSL (only after steps 1-3 succeed)
sudo certbot --nginx -d nexa-tn.com -d www.nexa-tn.com
# Certbot will: add HTTP→HTTPS redirect + activate the HTTPS block automatically

# 5. Verify HTTPS
curl -I https://nexa-tn.com/api/health
```

---

## Files Changed

| File | Change |
|------|--------|
| `docker-compose.yml` | `VITE_API_URL` default → `/api`, added `BACKEND_URL` |
| `Ecommerce/src/components/api.ts` | Comment added clarifying URL strategy |
| `nginx/nexa-tn.com.conf` | HTTP block serves full app; HTTPS block commented for post-certbot |
| `Ecommerce/src/components/HomePage.tsx` | `navigate('/login')` → `/auth/login` |
| `Ecommerce/src/components/Settings.tsx` | Parrainage link uses `window.location.origin` |
| `Ecommerce/src/page/Fournisseur/AddProduct.tsx` | Raw axios → shared `api` instance |
| `Ecommerce/src/page/tickets/TicketDetail.tsx` | Removed dead import from broken `./api` helper |
| `backend/src/app.js` | CORS accepts all variants of frontend domain |
| `backend/src/controllers/userController.js` | Upload URL uses `BACKEND_URL` |
