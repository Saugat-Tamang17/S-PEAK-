# S-PEAK — Day 2 Progress Log

> **Project:** S-PEAK (Speech Tutor App)
> **Date:** Day 2
> **Developer:** Saugat Tamang
> **Repo:** https://github.com/Saugat-Tamang17/S-PEAK

---

## ✅ What Was Accomplished Today

### 1. MySQL Verified Running
- Confirmed MySQL was already installed and running on Windows
- Logged in successfully via `mysql -u root -p`

### 2. Database Confirmed
- Existing database `s_peak` used as the project database
- Updated `.env` to use `DB_NAME=s_peak`

### 3. Schema Written and Executed
- Updated `internal/db/migrations/001_init.sql` (renamed to `schema.sql`)
- Switched from `VARCHAR(36)` UUID IDs to `INT AUTO_INCREMENT` — simpler and MySQL-native
- Executed SQL directly inside the `mysql>` prompt (PowerShell doesn't support `<` redirection)
- All 4 tables created successfully

**Tables created:**
| Table | Purpose |
|---|---|
| `users` | Stores user accounts |
| `sessions` | Ties each recording to a user and a mode |
| `transcripts` | Stores raw + enhanced speech text |
| `evaluations` | Stores tutor mode scores and feedback |

### 4. `internal/db/mysql.go` Written
- Builds DSN (Data Source Name) connection string
- Calls `sql.Open` to validate DSN format
- Calls `db.Ping()` to actually test the connection
- Sets connection pool: 10 max open, 5 max idle
- Blank import `_ "github.com/go-sql-driver/mysql"` registers the driver

### 5. `cmd/server/main.go` Updated
- Added `db.Connect()` call with all config values passed in
- Uses `log.Fatalf` to crash loudly if DB connection fails
- Uses `defer database.Close()` to clean up on exit
- Confirmed working output

**Final output:**
```
✅ Config loaded successfully
   DB Host     : localhost
   DB Port     : 3306
   DB Name     : s_peak
   Port        : 8080
   Groq API Key: NOT SET ⚠️
✅ Connected to MySQL successfully
Day 2 complete. Config + DB both working.
```

### 6. Committed and Pushed
```bash
git add .
git commit -m "Day 2: MySQL schema, db connection, ping test"
git push origin main
```

---

## ❌ Bugs Encountered and Fixed

### Bug 1 — PowerShell redirection error
**Error:**
```
The '<' operator is reserved for future use.
```
**Cause:** PowerShell does not support `<` for stdin redirection like Bash does
**Fix:** Used `Get-Content` pipe instead:
```powershell
Get-Content internal/db/migrations/schema.sql | mysql -u root -p s_peak
```
**Lesson:** PowerShell is not Bash — redirection operators behave differently

### Bug 2 — Unknown MySQL driver
**Error:**
```
sql: unknown driver "mysql" (forgotten import?)
```
**Cause:** Missing blank import in `mysql.go` — the driver was never registered
**Fix:** Added `_ "github.com/go-sql-driver/mysql"` to the import block
**Lesson:** The `_` blank import is not optional — it runs the driver's `init()` which registers it with `database/sql`. Without it, `sql.Open("mysql", ...)` has no idea what "mysql" means.

---

## 🧠 Key Concepts Learned Today

| Concept | What It Means |
|---|---|
| `INT AUTO_INCREMENT` | MySQL generates the ID automatically — simpler than UUID, no Go code needed |
| DSN | Data Source Name — `user:pass@tcp(host:port)/dbname?parseTime=true` — the connection string MySQL expects |
| `sql.Open` vs `db.Ping()` | `Open` only validates the DSN format. `Ping` actually connects. Always call both. |
| Blank import `_` | Imports a package only for its side effects — registers the MySQL driver with `database/sql` |
| Connection pool | `*sql.DB` manages multiple connections automatically — never open/close per query |
| `parseTime=true` | Makes the MySQL driver convert `TIMESTAMP` columns to Go `time.Time` automatically |
| PowerShell vs Bash | PowerShell doesn't support `<` stdin redirection — use `Get-Content file \| command` instead |
| `defer database.Close()` | Ensures the DB connection is closed when `main()` exits — good practice even for short programs |

---

## 📋 Day 3 Plan — Chi Router + First API Endpoints

### Goal
By end of Day 3 you should have:
- Chi router wired up and running in `main.go`
- HTTP server listening on port 8080
- A `/health` endpoint that returns `200 OK` with a JSON response
- Route groups set up for `/api/v1/transcription` and `/api/v1/tutor`
- CORS middleware configured
- Tested all endpoints with a browser or curl

---

### Step 1 — Wire up the Router in `internal/api/router.go`

This file sets up all routes and returns an `http.Handler`:

```go
package api

import (
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/go-chi/cors"
)

func NewRouter() *chi.Mux {
    r := chi.NewRouter()

    // Built-in Chi middleware
    r.Use(middleware.Logger)    // logs every request
    r.Use(middleware.Recoverer) // recovers from panics gracefully

    // CORS — allows frontend to call this API
    r.Use(cors.Handler(cors.Options{
        AllowedOrigins: []string{"*"},
        AllowedMethods: []string{"GET", "POST", "OPTIONS"},
        AllowedHeaders: []string{"Content-Type"},
    }))

    // Health check — always useful
    r.Get("/health", healthHandler)

    // API route groups
    r.Route("/api/v1", func(r chi.Router) {
        r.Mount("/transcription", transcriptionRouter())
        r.Mount("/tutor", tutorRouter())
    })

    return r
}
```

---

### Step 2 — Write the Health Handler

In `internal/api/handlers/` create a `health.go`:

```go
package handlers

import (
    "encoding/json"
    "net/http"
)

func HealthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
        "app":    "S-PEAK",
    })
}
```

---

### Step 3 — Stub out Transcription and Tutor handlers

In `internal/api/handlers/transcription.go`:

```go
package handlers

import (
    "encoding/json"
    "net/http"
)

func TranscribeHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "message": "transcription endpoint — coming soon",
    })
}
```

Same pattern for `tutor.go` with `TutorHandler`.

---

### Step 4 — Start the HTTP Server in `main.go`

```go
// Day 3 addition
router := api.NewRouter()

log.Printf("🚀 Server starting on port %s", cfg.Port)
if err := http.ListenAndServe(":"+cfg.Port, router); err != nil {
    log.Fatalf("❌ Server failed: %v", err)
}
```

---

### Step 5 — Test with curl or browser

```powershell
# Health check
curl http://localhost:8080/health

# Transcription stub
curl http://localhost:8080/api/v1/transcription

# Tutor stub
curl http://localhost:8080/api/v1/tutor
```

Expected response from `/health`:
```json
{ "app": "S-PEAK", "status": "ok" }
```

---

### Step 6 — Commit
```bash
git add .
git commit -m "Day 3: Chi router, health endpoint, route stubs"
git push origin main
```

---

## 🧠 Concepts You Will Learn on Day 3

| Concept | What It Means |
|---|---|
| Chi router | Lightweight HTTP router for Go — handles URL patterns, method matching, middleware |
| `r.Use()` | Registers middleware that runs on every request through that router |
| `r.Route()` | Creates a sub-router scoped to a path prefix — keeps routes organized |
| `r.Mount()` | Attaches a separate router at a path — good for grouping related handlers |
| Middleware | A function that wraps a handler — runs before/after it (logging, auth, CORS) |
| CORS | Cross-Origin Resource Sharing — browsers block frontend JS from calling a different domain unless the server explicitly allows it |
| `http.ListenAndServe` | Starts the HTTP server and blocks forever (or until it crashes) |
| JSON response | `json.NewEncoder(w).Encode(...)` — writes a Go map/struct as JSON to the response body |
| Stub handler | A placeholder handler that returns a dummy response — lets you test routing before real logic exists |

---

## 🗓️ Overall Project Timeline (reference)

| Week | Focus |
|---|---|
| Week 1 | Setup, folder structure, config, MySQL, Router |
| Week 2 | Groq AI services (STT, Enhancer, Evaluator) |
| Week 3 | REST API handlers + Chi router (full) |
| Week 4 | Frontend — mic recorder, Mode 1 |
| Week 5 | Frontend — Tutor Mode, History screen |
| Week 6 | Polish, deploy, README, final testing |
