# Sprint — Structured API Logging + Grafana/Loki Observability Stack

**Date:** 2026-03-07
**Status:** Implementation
**Author:** Claude Code

---

## 1. Problem Statement

The current backend has no structured logging. Every controller uses raw `console.error()` / `console.log()` calls scattered across 10+ files. Consequences:

- HTTP access logs don't exist — no request/response tracing
- Errors are unstructured plain text → impossible to query or alert on
- No persistent log files — Docker container restart = logs gone
- No visibility into auth events, business operations, or slow queries
- Zero observability tooling deployed in production

---

## 2. Goals

| Goal | Detail |
|------|--------|
| Structured logs | JSON format with timestamp, level, requestId, userId, route, latency |
| HTTP access logs | Every request/response captured via Morgan → Winston |
| File rotation | Daily rotating files, 14-day retention, gzip-compressed |
| Auth event logs | Login, logout, register, token refresh, failed auth attempts |
| Business event logs | Order creation, withdrawal request, vendor registration |
| Error centralization | Global Express error handler, all caught errors routed through logger |
| Production observability | Grafana + Loki + Promtail stack deployed via Docker Compose |
| Nginx integration | Grafana accessible at `https://nexa-tn.com/grafana/` |

---

## 3. Technology Choices

### Why Grafana + Loki over ELK ?

| Criterion | ELK (Elasticsearch + Logstash + Kibana) | Grafana + Loki + Promtail |
|-----------|----------------------------------------|---------------------------|
| RAM footprint | 4–8 GB | ~400 MB |
| Log storage | Full-text index (expensive) | Label-only index (cheap) |
| Query language | Lucene / KQL | LogQL (SQL-like, simple) |
| Setup complexity | High (3 services + configs) | Low (3 lightweight services) |
| Suitable for VPS | No | Yes |
| JSON log parsing | Yes | Yes (via pipeline stages) |

**Decision: Grafana + Loki + Promtail**

### Node.js Logging Stack

| Package | Role |
|---------|------|
| `winston` | Core logger, multi-transport, log levels |
| `winston-daily-rotate-file` | Daily file rotation with gzip compression |
| `morgan` | HTTP request/response access log middleware |

---

## 4. Architecture

### 4.1 Log Flow

```mermaid
flowchart LR
    subgraph Express["Express App (container: backend)"]
        direction TB
        A[Incoming Request] --> B[Morgan HTTP Middleware]
        B --> C[Route Handler / Controller]
        C --> D{Success?}
        D -- Yes --> E[logger.info / logger.debug]
        D -- No --> F[logger.error + stack trace]
        C --> G[Auth Events\n logger.warn on failure]
    end

    subgraph Winston["Winston Transports"]
        H[Console Transport\nColorized, human-readable]
        I[DailyRotateFile\napp-YYYY-MM-DD.log\nJSON, 14 days]
        J[DailyRotateFile\nerror-YYYY-MM-DD.log\nJSON, 30 days]
        K[DailyRotateFile\nhttp-YYYY-MM-DD.log\nJSON, 14 days]
    end

    Express --> H
    E --> I
    F --> J
    B --> K

    subgraph Volume["Docker Volume: logs"]
        L["/app/logs/\n app-*.log\n error-*.log\n http-*.log"]
    end

    I --> L
    J --> L
    K --> L

    subgraph Monitoring["Monitoring Stack"]
        M[Promtail\nTails log files\nAdds labels]
        N[Loki\nLog aggregation\nLabel-based storage]
        O[Grafana\nDashboards\nAlerts]
    end

    L --> M --> N --> O
```

### 4.2 Docker Service Topology

```mermaid
graph TB
    subgraph VPS["Contabo VPS"]
        subgraph Nginx["Nginx (bare-metal)"]
            NX1["/ → :3000 frontend"]
            NX2["/api/ → :4001 backend"]
            NX3["/grafana/ → :3001 grafana"]
        end

        subgraph Docker["Docker Compose Network"]
            FE["frontend :3000"]
            BE["backend :4001\n+ Winston logger\n+ Morgan middleware"]
            DB["postgres :5432"]
            LK["loki :3100\nLog storage"]
            PT["promtail\nLog shipper"]
            GF["grafana :3001\nDashboards"]
        end

        subgraph Volumes["Docker Volumes"]
            PG["pgdata\nPostgres data"]
            LG["logs\n/app/logs/*.log"]
            LD["loki-data\nLoki chunks"]
            GD["grafana-data\nGrafana state"]
        end
    end

    NX3 --> GF
    NX2 --> BE
    BE --> LG
    PT --> LG
    PT --> LK
    GF --> LK
    BE --> DB
    DB --> PG
    LK --> LD
    GF --> GD
```

---

## 5. Log Levels & When to Use Them

```mermaid
flowchart TD
    E["error\nUnhandled exceptions\nDB connection failures\nExternal service errors"]
    W["warn\nFailed auth attempts\nUnauthorized access\nMissing optional env vars\nRate limit near threshold"]
    I["info\nApp startup / shutdown\nSuccessful login / logout\nBusiness events (order created, retrait approved)\nVendeur registered"]
    H["http\nEvery HTTP request/response\n(via Morgan)"]
    D["debug\nDetailed flow tracing\nSequelize query logs\nOnly in NODE_ENV=development"]
```

---

## 6. Instrumentation Points

### 6.1 Application Lifecycle (`server.js`)

```mermaid
sequenceDiagram
    participant OS
    participant Server
    participant Logger

    OS->>Server: node src/server.js
    Server->>Logger: info("Server started", { port, env, pid })
    Note over Server: app.listen()

    OS->>Server: SIGTERM (docker stop)
    Server->>Logger: info("Graceful shutdown initiated")
    Server->>Server: Close HTTP connections
    Server->>Logger: info("Server closed")
    Server->>OS: process.exit(0)
```

### 6.2 HTTP Request Lifecycle (Morgan + Winston)

```mermaid
sequenceDiagram
    participant Client
    participant Nginx
    participant Morgan
    participant Controller
    participant Logger

    Client->>Nginx: POST /api/auth/login
    Nginx->>Morgan: Forward (X-Forwarded-For set)
    Morgan->>Controller: next()
    Controller-->>Morgan: response 200
    Morgan->>Logger: http("POST /api/auth/login 200 48ms")
    Logger-->>File: http-2026-03-07.log (JSON)
    Logger-->>Console: [timestamp] http: POST /api/auth/login 200 48ms
```

### 6.3 Auth Events (`authController.js` + `authMiddleware.js`)

| Event | Level | Fields |
|-------|-------|--------|
| `registerVendeur` success | `info` | userId, email, pack, ip |
| `login` success | `info` | userId, role, ip |
| `login` failed (bad password) | `warn` | email, ip, reason |
| `login` failed (user not found) | `warn` | email, ip |
| Token expired | `warn` | userId, route |
| Token invalid | `warn` | ip, route |
| `logout` | `info` | userId |
| Password reset requested | `info` | email, ip |
| Account activated | `info` | userId |
| Activation email failed | `warn` | userId, error |

### 6.4 Business Events (Controllers)

| Controller | Events Logged |
|-----------|---------------|
| `commandeController` | Order created (orderId, vendeurId, total), order status changed |
| `adminController` | User status changed, permission assigned, specialist assigned |
| `userController` | Profile updated, avatar uploaded |
| `specialistController` | Task assigned, task status updated, product validated |
| `demandeRetraitController` | Withdrawal requested, approved, rejected |
| `pickupController` | Pickup scheduled, completed |
| `parrainageController` | Parrainage applied, bonus credited |
| `ticketsController` | Ticket created, ticket replied, ticket closed |

### 6.5 Global Error Handler (`app.js`)

```mermaid
flowchart LR
    A[Controller throws] --> B{Error type}
    B -- ValidationError --> C[logger.warn 400]
    B -- Sequelize error --> D[logger.error 500\nwith SQL details]
    B -- JWT error --> E[logger.warn 401]
    B -- Unknown --> F[logger.error 500\nfull stack trace]
    C & D & E & F --> G[JSON response to client\nNo stack leak in prod]
```

---

## 7. Log File Structure

```
/app/logs/                          ← Docker volume mount point
├── app-2026-03-07.log              ← All levels ≥ info (JSON, 14 days)
├── app-2026-03-07.log.gz           ← Previous days compressed
├── error-2026-03-07.log            ← Errors only (JSON, 30 days)
└── http-2026-03-07.log             ← HTTP access log (JSON, 14 days)
```

### Sample JSON log line

```json
{
  "timestamp": "2026-03-07T14:23:01.456Z",
  "level": "info",
  "message": "Vendeur registered",
  "userId": 42,
  "email": "vendor@example.com",
  "pack": "starter",
  "ip": "197.12.34.56",
  "service": "nexa-backend"
}
```

---

## 8. Promtail Pipeline — Label Strategy

```mermaid
flowchart TD
    A["Log file: /var/log/nexa/app-*.log"] --> B[Promtail reads line]
    B --> C{Is JSON?}
    C -- Yes --> D["Extract labels:\nlevel, service"]
    C -- No --> E["label: level=unknown"]
    D & E --> F["Push to Loki with labels:\n{job='nexa-backend', level='error'}"]
    F --> G[Grafana LogQL query:\n{job='nexa-backend', level='error'}]
```

---

## 9. Grafana Dashboard Panels

```mermaid
graph LR
    subgraph Dashboard["Nexa API — Grafana Dashboard"]
        P1["Request Rate\n(req/min by status code)"]
        P2["Error Rate\n(5xx per minute)"]
        P3["Auth Events\n(login / logout / failed)"]
        P4["Business Events\n(orders / retraits / registrations)"]
        P5["Log Browser\n(full log stream, filterable)"]
        P6["Top Slow Routes\n(parsed from http logs)"]
    end
```

---

## 10. Nginx — Grafana Sub-path

Add to `nginx/nexa-tn.com.conf` inside the HTTPS server block:

```nginx
location /grafana/ {
    proxy_pass         http://127.0.0.1:3001/;
    proxy_http_version 1.1;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

---

## 11. File Change Summary

```mermaid
gitGraph
   commit id: "baseline"
   branch sprint/logging
   checkout sprint/logging
   commit id: "add winston + morgan deps"
   commit id: "create src/config/logger.js"
   commit id: "create src/middlewares/httpLogger.js"
   commit id: "app.js: trust proxy + httpLogger + global error handler"
   commit id: "server.js: startup/shutdown logs + graceful shutdown"
   commit id: "authMiddleware.js: auth event logs"
   commit id: "authController.js: replace console → logger"
   commit id: "all controllers: replace console → logger"
   commit id: "monitoring/: loki + promtail + grafana configs"
   commit id: "docker-compose.yml: add loki + promtail + grafana + logs volume"
   commit id: "nginx: add /grafana/ proxy location"
   checkout main
   merge sprint/logging
```

### Files Created

| File | Purpose |
|------|---------|
| `backend/src/config/logger.js` | Winston logger instance with all transports |
| `backend/src/middlewares/httpLogger.js` | Morgan → Winston HTTP access log |
| `monitoring/loki-config.yml` | Loki server configuration |
| `monitoring/promtail-config.yml` | Promtail scrape config for log files |
| `monitoring/grafana/provisioning/datasources/loki.yml` | Auto-provision Loki datasource |
| `monitoring/grafana/provisioning/dashboards/dashboard.yml` | Auto-provision dashboard folder |
| `monitoring/grafana/dashboards/nexa-api.json` | Pre-built Nexa API dashboard |

### Files Modified

| File | Changes |
|------|---------|
| `backend/package.json` | Add `winston`, `winston-daily-rotate-file`, `morgan` |
| `backend/src/app.js` | Import httpLogger, global error handler |
| `backend/src/server.js` | Startup/shutdown log + SIGTERM handler |
| `backend/src/middlewares/authMiddleware.js` | Auth failure/success logs |
| `backend/src/controllers/*.js` | Replace `console.*` → `logger.*` (all 10 controllers) |
| `backend/src/config/database.js` | Sequelize slow-query logging in dev |
| `docker-compose.yml` | Add loki, promtail, grafana services + logs/loki/grafana volumes |
| `nginx/nexa-tn.com.conf` | Add `/grafana/` proxy location |

---

## 12. Post-Deploy Checklist

- [ ] `docker compose up --build -d` on VPS
- [ ] Verify `docker logs nexa-app-backend-1` shows structured JSON in console
- [ ] Verify `/app/logs/` volume has rotating log files (`docker exec backend ls /app/logs`)
- [ ] Open `https://nexa-tn.com/grafana/` → login (admin / from .env GRAFANA_PASSWORD)
- [ ] Verify Loki datasource is connected (Grafana → Connections → Data Sources)
- [ ] Open Nexa API dashboard → confirm logs stream in
- [ ] Add `GRAFANA_PASSWORD` to `.env` on VPS
- [ ] Update Nginx config on VPS and `nginx -t && systemctl reload nginx`

---

## 13. Environment Variables Added

Add to root `.env` on VPS:

```env
# Observability
GRAFANA_USER=admin
GRAFANA_PASSWORD=<choose-a-strong-password>
LOG_LEVEL=info
```
