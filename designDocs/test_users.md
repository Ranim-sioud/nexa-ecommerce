# Test Users — Nexa Ecommerce

All accounts below are created by `backend/seeders/seed.js`.
Use these to test the app manually across all roles.

> **Note:** Vendeur and Fournisseur accounts must be **registered via the signup form** and then **activated by Admin** — they are not seeded automatically.

---

## Admin

| Field     | Value                                      |
|-----------|--------------------------------------------|
| Email     | from `ADMIN_EMAIL` env var (VPS `.env`)    |
| Password  | from `ADMIN_PASSWORD` env var (VPS `.env`) |
| Role      | `admin`                                    |
| Active    | ✅ yes (seeded as `actif: true`)           |

> Default docker-compose fallbacks: `ADMIN_NOM=Admin`, `ADMIN_TELEPHONE=20000000`, `ADMIN_VILLE=Tunis`

---

## Spécialistes (all share the same password)

**Password for all:** `password123`
**Status:** require admin activation (`actif` defaults to `false` — activate via `/adminUsers`)

| # | Nom                         | Email                      | Téléphone  | Domaine ticket      |
|---|-----------------------------|----------------------------|------------|---------------------|
| 1 | Spécialiste IT              | it@gmail.com               | 20000001   | IT                  |
| 2 | Spécialiste Logistique      | logistique@gmail.com       | 20000002   | Logistique          |
| 3 | Spécialiste Financier       | financier@gmail.com        | 20000003   | Financier           |
| 4 | Spécialiste Comptes         | compte@gmail.com           | 20000004   | Compte              |
| 5 | Spécialiste Formation       | formation@gmail.com        | 20000005   | Formation           |
| 6 | Spécialiste Produits        | produit@gmail.com          | 20000006   | Produit             |
| 7 | Spécialiste Fonctionnalités | fonctionnalite@gmail.com   | 20000007   | Demande Fonctionnalité |
| 8 | Spécialiste Stock           | stock@gmail.com            | 20000008   | Confirmation Stock  |

---

## Vendeur & Fournisseur

These roles are **not seeded** — they self-register and must be approved.

### Registration flow

```
1. POST /api/auth/register-vendeur   → receives activation email
   or
   POST /api/auth/register-fournisseur

2. Admin activates the account at /adminUsers (toggle actif)

3. User can now log in at /auth/login
```

### Quick test accounts (create manually)

| Role        | Suggested email          | Suggested password  | Registration endpoint              |
|-------------|--------------------------|---------------------|------------------------------------|
| Vendeur     | vendeur@test.local       | Test1234!           | `POST /api/auth/register-vendeur`  |
| Fournisseur | fournisseur@test.local   | Test1234!           | `POST /api/auth/register-fournisseur` |

---

## Route access by role

| Route                        | admin | vendeur | fournisseur | specialiste |
|------------------------------|:-----:|:-------:|:-----------:|:-----------:|
| `/adminDashboard`            | ✅    | ❌      | ❌          | ❌          |
| `/adminUsers`                | ✅    | ❌      | ❌          | ❌          |
| `/admin/specialists`         | ✅    | ❌      | ❌          | ❌          |
| `/admin/permissions`         | ✅    | ❌      | ❌          | ❌          |
| `/admin/tasks`               | ✅    | ❌      | ❌          | ❌          |
| `/AdminParrainage`           | ✅    | ❌      | ❌          | ❌          |
| `/demandeRetrait`            | ✅    | ❌      | ❌          | ❌          |
| `/HistoriqueTransactions`    | ✅    | ❌      | ❌          | ❌          |
| `/dashboard`                 | ✅    | ✅      | ❌          | ❌          |
| `/CreerCommande`             | ✅    | ✅      | ❌          | ❌          |
| `/ListeCommandes`            | ✅    | ✅      | ❌          | ❌          |
| `/MesProduits`               | ✅    | ✅      | ❌          | ❌          |
| `/transaction`               | ✅    | ✅      | ❌          | ❌          |
| `/VendeurParrainage`         | ✅    | ✅      | ❌          | ❌          |
| `/dashboardF`                | ✅    | ❌      | ✅          | ❌          |
| `/ListeCommandeFournisseur`  | ✅    | ❌      | ✅          | ❌          |
| `/pickup`                    | ✅    | ❌      | ✅          | ❌          |
| `/ProductList`               | ✅    | ❌      | ✅          | ❌          |
| `/specialist/dashboard`      | ✅    | ❌      | ❌          | ✅          |
| `/specialist/users`          | ✅    | ❌      | ❌          | ✅          |
| `/specialist/products`       | ✅    | ❌      | ❌          | ✅          |
| `/specialist/tasks`          | ✅    | ❌      | ❌          | ✅          |
| `/ticket`, `/settings`, etc. | ✅    | ✅      | ✅          | ✅          |

---

## Grafana (monitoring)

| Field    | Value                              |
|----------|------------------------------------|
| URL      | https://nexa-tn.com/grafana/       |
| User     | `GRAFANA_USER` env (default: `admin`) |
| Password | `GRAFANA_PASSWORD` env (default: `nexa-grafana-2026`) |
