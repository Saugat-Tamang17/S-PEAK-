# S-PEAK — Day 7 Progress Log

> **Project:** S-PEAK (Speech Tutor App)
> **Date:** Day 7
> **Developer:** Saugat Tamang
> **Repo:** https://github.com/Saugat-Tamang17/S-PEAK

---

## ✅ What Was Accomplished Today

### 1. `internal/services/groq/evaluate.go` — Added `topic` Parameter

Updated `Evaluate()` to accept a `topic` string and inject it into the system prompt:

```go
func Evaluate(apiKey string, transcript string, topic string) (string, error) {
    systemPrompt := "You are an English speech tutor."
    if topic != "" {
        systemPrompt += " The speaker was asked to talk about: " + topic + "."
    }
    systemPrompt += " Evaluate the transcript for grammar, fluency, and content relevance. Give specific, actionable feedback."

    payload := map[string]interface{}{
        "model": "llama-3.3-70b-versatile",
        "messages": []map[string]string{
            {"role": "system", "content": systemPrompt},
            {"role": "user",   "content": transcript},
        },
        "max_tokens":  1024,
        "temperature": 0.5,
    }
    // ... rest of function unchanged
}
```

**Why:** `TutorHandler` passes a `topic` field from the request body. Without this change the evaluator had no context about what the speaker was supposed to say — feedback was generic rather than relevant.

---

### 2. `internal/api/router.go` — Wired `*sql.DB` Into Handlers

Updated `NewRouter` to accept the database and pass it into both handlers:

```go
package api

import (
    "database/sql"

    "github.com/Saugat-Tamang17/S-PEAK/internal/api/handlers"
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/go-chi/cors"
)

func NewRouter(groqAPIKey string, database *sql.DB) *chi.Mux {
    r := chi.NewRouter()

    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(cors.Handler(cors.Options{
        AllowedOrigins: []string{"*"},
        AllowedMethods: []string{"GET", "POST", "OPTIONS"},
        AllowedHeaders: []string{"Content-Type"},
    }))

    r.Get("/health", handlers.HealthHandler)

    r.Route("/api/v1", func(r chi.Router) {
        r.Post("/transcription", handlers.TranscribeHandler(groqAPIKey, database))
        r.Post("/tutor", handlers.TutorHandler(groqAPIKey, database))
    })

    return r
}
```

**Why:** Handler signatures were updated on Day 6 to accept `*sql.DB`, but the router was still calling the old signature. This was the missing connection between the DB setup in `main.go` and the handlers that write to it.

---

### 3. `cmd/server/main.go` — One-Line Change

Updated the router call to pass the database:

```go
// Before (Day 6)
router := api.NewRouter(cfg.GroqAPIKey)

// After (Day 7)
router := api.NewRouter(cfg.GroqAPIKey, database)
```

Nothing else in `main.go` changed. The DB was already connected and assigned to `database` — it just wasn't being passed down.

---

### 4. Placeholder User Inserted into MySQL

Run once to satisfy the `sessions.user_id` foreign key constraint:

```sql
USE s_peak;
INSERT IGNORE INTO users (id, email, password_hash) VALUES (1, 'test@speal.dev', 'placeholder');
```

`INSERT IGNORE` used so it's safe to run again without throwing a duplicate key error.

---

### 5. Full End-to-End Test — Both Modes Working

```powershell
# Start the server
go run cmd/server/main.go

# Mode 1 — Transcription
curl.exe -X POST http://localhost:8080/api/v1/transcription `
  -F "audio=@C:\path\to\test.mp3"

# Expected:
# {
#   "raw_transcript":      "um so I went to the store and uh bought milk",
#   "enhanced_transcript": "I went to the store and bought milk."
# }

# Mode 2 — Tutor
curl.exe -X POST http://localhost:8080/api/v1/tutor `
  -H "Content-Type: application/json" `
  -d "{\"transcript\": \"I goes to store yesterday\", \"topic\": \"daily routine\"}"

# Expected:
# {"feedback": "The sentence 'I goes to store' has a subject-verb agreement error..."}
```

---

### 6. MySQL Rows Verified

After each curl test:

```sql
USE s_peak;
SELECT * FROM sessions ORDER BY id DESC LIMIT 5;
SELECT * FROM transcripts ORDER BY id DESC LIMIT 5;
SELECT * FROM evaluations ORDER BY id DESC LIMIT 5;
```

Real rows confirmed in all three tables. Foreign keys resolving correctly with `user_id=1`.

---

### 7. Committed and Pushed

```bash
git add .
git commit -m "Day 7: wire router + main, fix evaluate topic param, full end-to-end working"
git push origin main
```

---

## 🧠 Key Concepts Learned Today

| Concept | What It Means |
|---|---|
| End-to-end testing | Running the full chain (curl → handler → Groq → DB → response) and verifying each layer worked, not just the final output |
| Foreign key constraint | MySQL enforces that `user_id=1` in `sessions` must exist in `users` — it rejects the insert otherwise |
| `INSERT IGNORE` | Skips the insert silently if a duplicate key already exists — safer than bare `INSERT` for setup/seed data |
| `SELECT *` after writes | The fastest way to confirm DB writes actually worked — don't trust the 200 response alone |
| Prompt engineering with context | Passing `topic` into the system prompt makes LLM feedback relevant to what the speaker was actually supposed to say |
| Two-line `main.go` change | Good architecture means adding a feature (DB into router) is a tiny change at the top — all the real work was already done in the layers below |

---

## 🗓️ Overall Project Timeline (reference)

| Day | Status | Focus |
|---|---|---|
| 1 | ✅ | Project structure, go module, config |
| 2 | ✅ | MySQL schema, DB connection |
| 3 | ✅ | Chi router, health endpoint, stubs |
| 4 | ✅ | Groq Whisper STT |
| 5 | ✅ | Groq Evaluator |
| 6 | ✅ | Text Enhancer + DB query helpers + updated handler signatures |
| **7** | ✅ | **Wire router + main, fix evaluate topic param, full end-to-end working** |
| 8 | 📋 | Structured JSON scores from Evaluator |
| Week 3 | 📋 | Full REST handlers, session.go, auth |
| Week 4 | 📋 | Frontend — mic recorder, Mode 1 |
| Week 5 | 📋 | Frontend — Tutor Mode, History screen |
| Week 6 | 📋 | Polish, deploy, README, final testing |
