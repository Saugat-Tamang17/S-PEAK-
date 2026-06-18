# S-PEAK — Day 8 Plan

> **Project:** S-PEAK (Speech Tutor App)
> **Date:** Day 8
> **Developer:** Saugat Tamang
> **Repo:** https://github.com/Saugat-Tamang17/S-PEAK

---

## 🎯 Goal for Today

By end of Day 8 you should have:
- `evaluate.go` returning **structured JSON scores** (grammar, fluency, content, overall as real integers)
- A new `internal/models/evaluation.go` struct to hold those scores cleanly
- `tutor.go` handler updated to parse the structured scores and save real numbers to DB instead of `0` placeholders
- A new `GET /api/v1/history` endpoint that returns a user's past sessions with their scores
- A new `db/queries.go` read function (`GetSessionHistory`) to power that endpoint
- All of this tested with curl and DB rows verified

This is a **longer session** intentionally — completing it today means Friday (Week 3) starts fresh on auth without any leftover backend debt.

---

## Step 1 — Create `internal/models/evaluation.go`

Right now scores are `0` placeholders because `Evaluate()` returns a plain string. The fix starts here: define a struct that holds the parsed scores.

Create a new file `internal/models/evaluation.go`:

```go
package models

// EvaluationResult holds the structured scores returned by the Groq evaluator.
type EvaluationResult struct {
    GrammarScore  int    `json:"grammar_score"`
    FluencyScore  int    `json:"fluency_score"`
    ContentScore  int    `json:"content_score"`
    OverallScore  int    `json:"overall_score"`
    Feedback      string `json:"feedback"`
    CorrectedText string `json:"corrected_text"`
}
```

**Why a separate `models` package?** Both the handler and the DB query function need this type. Putting it in `models` means neither package imports the other — no circular dependency.

---

## Step 2 — Update `internal/services/groq/evaluate.go`

Change the return type from `(string, error)` to `(*models.EvaluationResult, error)` and update the system prompt to force JSON output.

```go
package groq

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"

    "github.com/Saugat-Tamang17/S-PEAK/internal/models"
)

func Evaluate(apiKey string, transcript string, topic string) (*models.EvaluationResult, error) {
    systemPrompt := `You are an English speech tutor. Evaluate the transcript and respond ONLY with a JSON object — no markdown, no preamble, no explanation outside the JSON.

Return exactly this structure:
{
  "grammar_score":  <integer 0-10>,
  "fluency_score":  <integer 0-10>,
  "content_score":  <integer 0-10>,
  "overall_score":  <integer 0-10>,
  "feedback":       "<2-3 sentences of actionable feedback>",
  "corrected_text": "<the transcript rewritten with errors fixed>"
}`

    if topic != "" {
        systemPrompt += "\n\nThe speaker was asked to talk about: " + topic + ". Factor relevance into content_score."
    }

    payload := map[string]interface{}{
        "model": "llama-3.3-70b-versatile",
        "messages": []map[string]string{
            {"role": "system", "content": systemPrompt},
            {"role": "user",   "content": transcript},
        },
        "max_tokens":  1024,
        "temperature": 0.2, // Low temp — we want consistent JSON, not creative variation
    }

    body, err := json.Marshal(payload)
    if err != nil {
        return nil, fmt.Errorf("marshal payload: %w", err)
    }

    req, err := http.NewRequest("POST", chatURL, bytes.NewBuffer(body))
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := (&http.Client{}).Do(req)
    if err != nil {
        return nil, fmt.Errorf("groq evaluate request: %w", err)
    }
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)

    var groqResp EvaluateResponse
    if err := json.Unmarshal(respBody, &groqResp); err != nil {
        return nil, fmt.Errorf("parse groq response: %w", err)
    }
    if len(groqResp.Choices) == 0 || groqResp.Choices[0].Message.Content == "" {
        return nil, fmt.Errorf("groq returned empty — raw: %s", string(respBody))
    }

    rawJSON := groqResp.Choices[0].Message.Content

    var result models.EvaluationResult
    if err := json.Unmarshal([]byte(rawJSON), &result); err != nil {
        return nil, fmt.Errorf("parse evaluation JSON: %w — raw content: %s", err, rawJSON)
    }

    return &result, nil
}
```

**Why `temperature: 0.2`?** Lower than the `0.5` we used before. We're not asking for creativity — we need consistent, parseable JSON every time. Higher temperature increases the chance the model adds a sentence before the `{` which breaks `json.Unmarshal`.

**Why does the error include `rawJSON`?** If the LLM does add a preamble like `"Here is the evaluation:"` before the JSON, the unmarshal will fail. Logging `rawJSON` in the error makes debugging that instantly obvious.

---

## Step 3 — Update `internal/db/queries.go` — Save Real Scores

`SaveEvaluation` already accepts score integers — the only change is the call site in the handler now passes real values instead of `0`. But while you're in this file, also add the read function for history.

Add `GetSessionHistory` to the bottom of `queries.go`:

```go
// SessionRow is what GetSessionHistory returns — one row per session.
type SessionRow struct {
    SessionID     int64     `json:"session_id"`
    Mode          string    `json:"mode"`
    CreatedAt     time.Time `json:"created_at"`
    RawText       string    `json:"raw_text"`
    EnhancedText  string    `json:"enhanced_text"`
    GrammarScore  *int      `json:"grammar_score"`  // pointer — NULL if transcription mode
    FluencyScore  *int      `json:"fluency_score"`
    ContentScore  *int      `json:"content_score"`
    OverallScore  *int      `json:"overall_score"`
    Feedback      *string   `json:"feedback"`
}

func GetSessionHistory(database *sql.DB, userID int) ([]SessionRow, error) {
    query := `
        SELECT
            s.id, s.mode, s.created_at,
            t.raw_text, t.enhanced_text,
            e.grammar_score, e.fluency_score, e.content_score, e.overall_score, e.feedback
        FROM sessions s
        JOIN transcripts t ON t.session_id = s.id
        LEFT JOIN evaluations e ON e.transcript_id = t.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT 20
    `

    rows, err := database.Query(query, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var result []SessionRow
    for rows.Next() {
        var r SessionRow
        err := rows.Scan(
            &r.SessionID, &r.Mode, &r.CreatedAt,
            &r.RawText, &r.EnhancedText,
            &r.GrammarScore, &r.FluencyScore, &r.ContentScore, &r.OverallScore, &r.Feedback,
        )
        if err != nil {
            return nil, err
        }
        result = append(result, r)
    }
    return result, rows.Err()
}
```

**Why pointer types (`*int`, `*string`) for scores?** Transcription-mode sessions don't have evaluations — the `LEFT JOIN` returns `NULL` for those columns. Go's `json.Unmarshal` and `sql.Scan` both handle `NULL` → pointer correctly. A plain `int` would panic on NULL scan.

**Why `LIMIT 20`?** History endpoints should always have a cap. Without it, a user with 1000 sessions returns 1000 rows on every page load. Pagination comes later — for now `LIMIT 20` is safe and fast.

**Why `LEFT JOIN` for evaluations?** Transcription-mode sessions only write to `sessions` and `transcripts`, not `evaluations`. An `INNER JOIN` would silently hide those sessions from history. `LEFT JOIN` keeps them and just returns NULL for the score columns.

---

## Step 4 — Create `internal/api/handlers/history.go`

New file — new handler for `GET /api/v1/history`:

```go
package handlers

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"

    "github.com/Saugat-Tamang17/S-PEAK/internal/db"
)

func HistoryHandler(database *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // TODO Week 3: replace with real user ID from JWT
        userID := 1

        rows, err := db.GetSessionHistory(database, userID)
        if err != nil {
            log.Printf("GetSessionHistory error: %v", err)
            http.Error(w, "database error", http.StatusInternalServerError)
            return
        }

        // Return empty array instead of null when no sessions exist
        if rows == nil {
            rows = []db.SessionRow{}
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(rows)
    }
}
```

**Why `rows = []db.SessionRow{}`?** If the user has no sessions, `GetSessionHistory` returns `nil`. `json.Encode(nil)` produces `null` in JSON. Frontend code checking `response.length` on `null` will crash. An empty array `[]` is always safer.

---

## Step 5 — Update `internal/api/handlers/tutor.go`

Two changes: use the new `*models.EvaluationResult` return type from `Evaluate()`, and pass real scores to `SaveEvaluation`.

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

        result, err := groq.Evaluate(apiKey, input.Transcript, input.Topic)
        if err != nil {
            log.Printf("Evaluate error: %v", err)
            http.Error(w, "evaluation failed", http.StatusInternalServerError)
            return
        }

        sessionID, err := db.CreateSession(database, 1, "tutor")
        if err != nil {
            log.Printf("CreateSession error: %v", err)
        }

        transcriptID, err := db.SaveTranscript(database, sessionID, input.Transcript, result.CorrectedText)
        if err != nil {
            log.Printf("SaveTranscript error: %v", err)
        }

        if err := db.SaveEvaluation(database, transcriptID, input.Topic,
            result.ContentScore, result.FluencyScore, result.GrammarScore, result.OverallScore,
            result.Feedback, result.CorrectedText,
        ); err != nil {
            log.Printf("SaveEvaluation error: %v", err)
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(result)
    }
}
```

**What changed from Day 7:** `groq.Evaluate()` now returns `*models.EvaluationResult` instead of a plain string. So instead of `json.Encode(map[string]string{"feedback": feedbackRaw})`, we return the full struct — which already has `json` tags so it serializes correctly. Real score integers are also now saved to DB.

---

## Step 6 — Register the New Route in `router.go`

Add one line to `router.go` inside the `/api/v1` block:

```go
r.Route("/api/v1", func(r chi.Router) {
    r.Post("/transcription", handlers.TranscribeHandler(groqAPIKey, database))
    r.Post("/tutor",         handlers.TutorHandler(groqAPIKey, database))
    r.Get("/history",        handlers.HistoryHandler(database))  // ← new
})
```

---

## Step 7 — Test Everything

```powershell
go run cmd/server/main.go
```

### Test structured scores from tutor:
```powershell
curl.exe -X POST http://localhost:8080/api/v1/tutor `
  -H "Content-Type: application/json" `
  -d "{\"transcript\": \"I goes to store yesterday and buyed milk\", \"topic\": \"daily routine\"}"
```

**Expected response (real numbers now):**
```json
{
  "grammar_score":  4,
  "fluency_score":  6,
  "content_score":  7,
  "overall_score":  5,
  "feedback":       "There are two verb errors: 'goes' should be 'went' and 'buyed' should be 'bought'. Otherwise the sentence is on-topic and clear.",
  "corrected_text": "I went to the store yesterday and bought milk."
}
```

### Test history endpoint:
```powershell
curl.exe http://localhost:8080/api/v1/history
```

**Expected response:**
```json
[
  {
    "session_id":    3,
    "mode":          "tutor",
    "created_at":    "2026-06-18T...",
    "raw_text":      "I goes to store yesterday and buyed milk",
    "enhanced_text": "I went to the store yesterday and bought milk.",
    "grammar_score": 4,
    "fluency_score": 6,
    "content_score": 7,
    "overall_score": 5,
    "feedback":      "There are two verb errors..."
  }
]
```

### Verify DB:
```sql
USE s_peak;
SELECT grammar_score, fluency_score, content_score, overall_score, feedback
FROM evaluations ORDER BY id DESC LIMIT 3;
```

Scores should now be real integers, not `0`.

---

## ❌ Bugs to Watch For

### Bug 1 — LLM adds preamble before JSON
**Symptom:** `parse evaluation JSON: invalid character 'H' looking for beginning of value — raw content: Here is the evaluation: {...}`
**Fix:** The error already logs the raw content. Copy it, check what the LLM added before `{`. Tighten the system prompt: add `"Do not include any text before or after the JSON object."` as the last line.

### Bug 2 — Score field name mismatch
**Symptom:** All scores come back as `0` even though the JSON looks right.
**Cause:** LLM returned `"grammar"` but your struct expects `"grammar_score"`. The unmarshal silently skips unknown fields.
**Fix:** Log `rawJSON` before unmarshaling and compare field names to your struct tags.

### Bug 3 — NULL scan panic on history
**Symptom:** `converting NULL to int is unsupported` on `rows.Scan()`
**Cause:** A transcription session has no evaluation row — the LEFT JOIN returns NULL for score columns but your struct uses `int` instead of `*int`.
**Fix:** Already handled in Step 3 with pointer types. Make sure you didn't copy `int` instead of `*int` when writing the struct.

### Bug 4 — History returns `null` instead of `[]`
**Symptom:** Frontend `JSON.parse` returns `null`, calling `.length` on it crashes.
**Fix:** Already handled in Step 4. Double-check the nil guard is there.

---

## 🧠 Key Concepts for Day 8

| Concept | What It Means |
|---|---|
| Structured output prompting | Telling the LLM to return *only* JSON with a specific schema — and using `temperature: 0.2` to keep it consistent and parseable |
| `json.Unmarshal` on LLM output | The LLM's reply is a string. You unmarshal it a second time (first was the Groq API wrapper, second is the evaluation JSON inside it) |
| Pointer types for nullable DB columns | `*int` and `*string` let `sql.Scan` handle NULL without panicking. The pointer is `nil` when the column is NULL — which also serializes to JSON `null` correctly |
| `LEFT JOIN` vs `INNER JOIN` | LEFT JOIN keeps rows even when the joined table has no matching row — essential when not all sessions have evaluations |
| `rows.Err()` check | Always call `rows.Err()` after the scan loop — it catches errors that happen during iteration, not just on `Query()` |
| Empty slice vs nil | `nil` encodes to JSON `null`. An empty slice `[]T{}` encodes to `[]`. Always return the slice for array endpoints |
| History `LIMIT` | Never return unbounded results from a history endpoint. `LIMIT 20` is safe for now; pagination comes later |

---

## 📋 Day 9 Preview — Auth Foundation (Week 3 Starts)

Day 8 finishes all the core feature backend. Day 9 starts auth:

- `POST /api/v1/auth/register` — hash password with bcrypt, insert into `users`
- `POST /api/v1/auth/login` — verify password, return a JWT
- JWT middleware that extracts real `user_id` and replaces all the hardcoded `1` placeholders
- Protected routes (history, tutor, transcription) behind the middleware

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
| 7 | ✅ | Wire router + main, fix evaluate topic param, full end-to-end working |
| **8** | **📋** | **Structured JSON scores, history endpoint, models package** |
| 9 | 📋 | Auth — register, login, bcrypt, JWT |
| 10 | 📋 | JWT middleware, protect routes, replace hardcoded userID |
| Week 4 | 📋 | Frontend — React setup, mic recorder, transcription screen |
| Week 5 | 📋 | Frontend — Tutor Mode UI, History screen |
| Week 6 | 📋 | Polish, deploy (Railway + Vercel), README, final testing |
