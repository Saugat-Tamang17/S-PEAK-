# S-PEAK — Day 6 Progress Log

> **Project:** S-PEAK (Speech Tutor App)
> **Date:** Day 6
> **Developer:** Saugat Tamang
> **Repo:** https://github.com/Saugat-Tamang17/S-PEAK

---

## ✅ What Was Accomplished Today

### 1. `internal/services/groq/enhance.go` Written
- Created `Enhance(apiKey string, rawTranscript string) (string, error)`
- Sends raw Whisper transcript to LLaMA 3.3 70B on Groq
- Removes filler words (um, uh, like, you know), fixes grammar, breaks run-on sentences
- Uses `temperature: 0.3` — low value keeps edits conservative, preserves speaker's meaning
- Reuses `EvaluateResponse` struct and `chatURL` constant already defined in `evaluate.go` — same package, no duplication needed
- Returns descriptive error with raw response body for debugging if Groq returns empty

```go
package groq

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func Enhance(apiKey string, rawTranscript string) (string, error) {
    payload := map[string]interface{}{
        "model": "llama-3.3-70b-versatile",
        "messages": []map[string]string{
            {
                "role": "system",
                "content": `You are a speech transcription editor. 
Clean up the following transcript by:
- Removing filler words (um, uh, like, you know)
- Fixing obvious grammar errors
- Breaking run-on sentences
- Preserving the speaker's original meaning and vocabulary
Return ONLY the cleaned transcript text. No commentary, no preamble.`,
            },
            {
                "role":    "user",
                "content": rawTranscript,
            },
        },
        "max_tokens":  1024,
        "temperature": 0.3,
    }

    body, err := json.Marshal(payload)
    if err != nil {
        return "", fmt.Errorf("failed to marshal payload: %w", err)
    }

    req, err := http.NewRequest("POST", chatURL, bytes.NewBuffer(body))
    if err != nil {
        return "", fmt.Errorf("failed to create request: %w", err)
    }

    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", fmt.Errorf("groq enhance request failed: %w", err)
    }
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)

    var result EvaluateResponse
    if err := json.Unmarshal(respBody, &result); err != nil {
        return "", fmt.Errorf("failed to parse enhance response: %w", err)
    }

    if len(result.Choices) == 0 || result.Choices[0].Message.Content == "" {
        return "", fmt.Errorf("groq enhancer returned empty — raw: %s", string(respBody))
    }

    return result.Choices[0].Message.Content, nil
}
```

### 2. `internal/db/queries.go` Written
- Created three DB helper functions — one per table write operation
- `CreateSession()` — inserts a row into `sessions`, returns `LastInsertId()`
- `SaveTranscript()` — inserts raw + enhanced text into `transcripts`, returns `LastInsertId()`
- `SaveEvaluation()` — inserts all tutor mode scores + feedback into `evaluations`
- Uses `LastInsertId()` to chain IDs across tables (session → transcript → evaluation)

```go
package db

import (
    "database/sql"
    "time"
)

func CreateSession(db *sql.DB, userID int, mode string) (int64, error) {
    result, err := db.Exec(
        `INSERT INTO sessions (user_id, mode, created_at) VALUES (?, ?, ?)`,
        userID, mode, time.Now(),
    )
    if err != nil {
        return 0, err
    }
    return result.LastInsertId()
}

func SaveTranscript(db *sql.DB, sessionID int64, raw, enhanced string) (int64, error) {
    result, err := db.Exec(
        `INSERT INTO transcripts (session_id, raw_text, enhanced_text, created_at) VALUES (?, ?, ?, ?)`,
        sessionID, raw, enhanced, time.Now(),
    )
    if err != nil {
        return 0, err
    }
    return result.LastInsertId()
}

func SaveEvaluation(db *sql.DB, transcriptID int64, topic string,
    content, fluency, grammar, overall int, feedback, corrected string) error {

    _, err := db.Exec(
        `INSERT INTO evaluations 
        (transcript_id, topic, content_score, fluency_score, grammar_score, overall_score, feedback, corrected_answer, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        transcriptID, topic, content, fluency, grammar, overall, feedback, corrected, time.Now(),
    )
    return err
}
```

### 3. `internal/api/handlers/transcription.go` Updated (STT → Enhance → DB)
- Handler signature updated: `TranscribeHandler(apiKey string, database *sql.DB)`
- Now chains three steps in sequence: Transcribe → Enhance → Save to DB
- Graceful degradation on Enhance failure — falls back to raw transcript instead of returning 500
- Hardcoded `userID=1` as placeholder (real auth comes in Week 3)
- Response now returns both `raw_transcript` and `enhanced_transcript`

```go
package handlers

import (
    "database/sql"
    "encoding/json"
    "io"
    "log"
    "net/http"

    "github.com/Saugat-Tamang17/S-PEAK/internal/db"
    groq "github.com/Saugat-Tamang17/S-PEAK/internal/services/groq"
)

func TranscribeHandler(apiKey string, database *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        r.ParseMultipartForm(10 << 20)

        file, header, err := r.FormFile("audio")
        if err != nil {
            log.Printf("FormFile error: %v", err)
            http.Error(w, "audio file required", http.StatusBadRequest)
            return
        }
        defer file.Close()

        audioBytes, _ := io.ReadAll(file)

        rawTranscript, err := groq.Transcribe(apiKey, audioBytes, header.Filename)
        if err != nil {
            log.Printf("STT error: %v", err)
            http.Error(w, "transcription failed", http.StatusInternalServerError)
            return
        }

        enhanced, err := groq.Enhance(apiKey, rawTranscript)
        if err != nil {
            log.Printf("Enhance error: %v — falling back to raw", err)
            enhanced = rawTranscript
        }

        sessionID, err := db.CreateSession(database, 1, "transcription")
        if err != nil {
            log.Printf("DB session error: %v", err)
            http.Error(w, "database error", http.StatusInternalServerError)
            return
        }

        _, err = db.SaveTranscript(database, sessionID, rawTranscript, enhanced)
        if err != nil {
            log.Printf("DB transcript error: %v", err)
            http.Error(w, "database error", http.StatusInternalServerError)
            return
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{
            "raw_transcript":      rawTranscript,
            "enhanced_transcript": enhanced,
        })
    }
}
```

### 4. `internal/api/handlers/tutor.go` Updated (Evaluate → DB)
- Handler signature updated: `TutorHandler(apiKey string, database *sql.DB)`
- Now accepts optional `topic` field in request body alongside `transcript`
- Calls `groq.Evaluate()`, then saves session + transcript + evaluation rows to DB
- DB errors on tutor save are logged but don't fail the response — feedback still returns
- Scores stored as `0` placeholders — will be real integers when Evaluate returns structured JSON (Day 8)

```go
package handlers

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"

    "github.com/Saugat-Tamang17/S-PEAK/internal/db"
    groq "github.com/Saugat-Tamang17/S-PEAK/internal/services/groq"
)

func TutorHandler(apiKey string, database *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var input struct {
            Transcript string `json:"transcript"`
            Topic      string `json:"topic"`
        }
        if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.Transcript == "" {
            http.Error(w, "transcript required", http.StatusBadRequest)
            return
        }

        feedbackRaw, err := groq.Evaluate(apiKey, input.Transcript, input.Topic)
        if err != nil {
            log.Printf("Evaluation error: %v", err)
            http.Error(w, "evaluation failed", http.StatusInternalServerError)
            return
        }

        sessionID, err := db.CreateSession(database, 1, "tutor")
        if err != nil {
            log.Printf("DB session error: %v", err)
        } else {
            transcriptID, err := db.SaveTranscript(database, sessionID, input.Transcript, input.Transcript)
            if err != nil {
                log.Printf("DB transcript error: %v", err)
            } else {
                _ = db.SaveEvaluation(database, transcriptID, input.Topic,
                    0, 0, 0, 0, feedbackRaw, "")
            }
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{
            "feedback": feedbackRaw,
        })
    }
}
```

### 5. `main.go` Tested — No Changes Needed Today
- Ran `go run cmd/server/main.go` to confirm all new files compile cleanly
- Router still calls old `api.NewRouter(cfg.GroqAPIKey)` — not updated yet (Day 7)
- New handler signatures and `queries.go` are written but not plugged into live routes until tomorrow

**Output confirmed:**
```
✅ Config loaded successfully
   DB Host     : localhost
   DB Port     : 3306
   DB Name     : s_peak
   Port        : 8080
   Groq API Key: SET ✅
✅ Connected to MySQL successfully
🚀 Server starting on port 8080
```

### 6. Committed and Pushed
```bash
git add .
git commit -m "Day 6: text enhancer, db query helpers, updated handler signatures"
git push origin main
```

---

## ❌ Bugs to Watch For Today

### Bug 1 — `chatURL` or `EvaluateResponse` undefined in enhance.go
**Cause:** These are defined in `evaluate.go` in the same `groq` package. If your `evaluate.go` file doesn't exist yet (Day 5 not done), they won't be found.
**Fix:** Complete Day 5 (`evaluate.go`) before Day 6, or temporarily copy the const and struct into `enhance.go` and remove the duplicate once Day 5 is done.

### Bug 2 — `Evaluate()` signature mismatch
**Cause:** Day 4 plan defined `Evaluate(apiKey, transcript)` but Day 6's `TutorHandler` passes a `topic` too.
**Fix:** Update `evaluate.go` signature to `Evaluate(apiKey, transcript, topic string)` and include `topic` in the system prompt so the LLM knows what the speaker was supposed to be talking about.

### Bug 3 — Foreign key constraint on `sessions.user_id`
**Cause:** Hardcoded `userID=1` will fail with a foreign key error if no user with `id=1` exists in the `users` table.
**Fix:** Manually insert a placeholder user once:
```sql
INSERT INTO users (email, password_hash) VALUES ('test@speal.dev', 'placeholder');
```
This gives you `id=1` to work with until real auth is built.

---

## 🧠 Key Concepts Learned Today

| Concept | What It Means |
|---|---|
| `temperature: 0.3` | Lower temperature = LLM makes more conservative, predictable outputs. Good for text cleaning where creativity is unwanted. |
| Graceful degradation | If a non-critical step fails (enhancer), fall back to a usable result (raw transcript) rather than returning a 500 error to the user. |
| `LastInsertId()` | Returns the `AUTO_INCREMENT` ID generated by the last `INSERT` — essential for chaining foreign keys across tables. |
| Reusing types across files | Types and constants in the same Go package are shared automatically. No re-declaration needed across files. |
| Hardcoded `userID=1` | A deliberate placeholder — auth is Week 3. Trying to build auth now would block everything else. Mark it with a `// TODO: replace with real user from JWT` comment. |
| Dependency injection | Both handlers take `apiKey` and `*sql.DB` as parameters — dependencies are explicit, not global. Makes handlers independently testable. |
| Chaining DB writes | `CreateSession` → `SaveTranscript` → `SaveEvaluation` must happen in order because each step needs the ID from the previous one. |

---

## 📋 Day 7 Plan — Wire Everything Together + Route Cleanup

### Goal
By end of Day 7 you should have:
- `router.go` updated to pass `*sql.DB` into both handlers
- `main.go` updated with the new `NewRouter` signature
- Both `/api/v1/transcription` and `/api/v1/tutor` fully live end-to-end
- Full curl test: audio in → Whisper → Enhance → saved to DB → response back
- MySQL verified: rows actually appearing in `sessions`, `transcripts`, `evaluations`
- `evaluate.go` signature fixed to accept `topic` parameter

---

### Step 1 — Fix `evaluate.go` to accept topic

Update the function signature and system prompt:

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
    }
    // ... rest stays the same
}
```

---

### Step 2 — Update `router.go`

```go
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

Add `"database/sql"` to the import block.

---

### Step 3 — Update `main.go`

One line change after the DB connection:

```go
router := api.NewRouter(cfg.GroqAPIKey, database)
```

---

### Step 4 — Insert the placeholder user

If you haven't already, run this in MySQL once:

```sql
USE s_peak;
INSERT INTO users (email, password_hash) VALUES ('test@speal.dev', 'placeholder');
-- Confirm: SELECT id FROM users; -- should show id=1
```

---

### Step 5 — Full end-to-end test

```powershell
# Start the server
go run cmd/server/main.go

# Test Mode 1
curl.exe -X POST http://localhost:8080/api/v1/transcription `
  -F "audio=@C:\path\to\test.mp3"

# Expected response:
# {
#   "raw_transcript":      "um so I went to the store and uh bought milk",
#   "enhanced_transcript": "I went to the store and bought milk."
# }

# Test Mode 2
curl.exe -X POST http://localhost:8080/api/v1/tutor `
  -H "Content-Type: application/json" `
  -d "{\"transcript\": \"I goes to store yesterday\", \"topic\": \"daily routine\"}"

# Expected response:
# {"feedback": "The sentence 'I goes to store' has a subject-verb agreement error..."}
```

---

### Step 6 — Verify rows in MySQL

```sql
USE s_peak;
SELECT * FROM sessions;
SELECT * FROM transcripts;
SELECT * FROM evaluations;
```

You should see real rows. If foreign key errors appear, check that `id=1` exists in `users`.

---

### Step 7 — Commit

```bash
git add .
git commit -m "Day 7: router + main wired, full end-to-end working"
git push origin main
```

---

## 🧠 Concepts You Will Learn on Day 7

| Concept | What It Means |
|---|---|
| End-to-end testing | Running the full chain (curl → handler → Groq → DB → response) and verifying each layer worked, not just the final output |
| Foreign key constraint errors | MySQL enforces that `user_id=1` in `sessions` must exist in `users` — it rejects the insert otherwise |
| `SELECT *` after writes | The fastest way to confirm your DB writes actually worked — don't trust the 200 response alone |
| Prompt engineering with context | Passing `topic` into the evaluator's system prompt makes the LLM's feedback relevant to what the user was actually supposed to say |
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
| 6 | ✅ | Text Enhancer + DB query helpers + updated handlers |
| **7** | **📋** | **Wire router + main, full end-to-end test** |
| 8 | 📋 | Structured JSON scores from Evaluator |
| Week 3 | 📋 | Full REST handlers, session.go, auth |
| Week 4 | 📋 | Frontend — mic recorder, Mode 1 |
| Week 5 | 📋 | Frontend — Tutor Mode, History screen |
| Week 6 | 📋 | Polish, deploy, README, final testing |
