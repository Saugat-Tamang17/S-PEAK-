# S-PEAK — Progress Tracker

> **Project:** S-PEAK (Speech Tutor App)
> **Developer:** Saugat Tamang
> **Repo:** https://github.com/Saugat-Tamang17/S-PEAK

---

## ✅ Day 8 — Structured Scores + History Endpoint

**Goal:** Replace `0` placeholder scores with real integers from Groq, and expose a `GET /api/v1/history` endpoint.

---

### Checklist

| # | Task | File | Status |
|---|---|---|---|
| 1 | Create `EvaluationResult` struct | `internal/models/evaluation.go` | ✅ Done |
| 2 | Update `Evaluate()` to return `*models.EvaluationResult` | `internal/services/groq/evaluate.go` | ✅ Done |
| 3 | Set `temperature: 0.2` + force JSON-only system prompt | `internal/services/groq/evaluate.go` | ✅ Done |
| 4 | Add `SessionRow` struct + `GetSessionHistory()` | `internal/db/queries.go` | ✅ Done |
| 5 | Create `HistoryHandler` | `internal/api/handlers/history.go` | ✅ Done |
| 6 | Update `TutorHandler` to use real scores | `internal/api/handlers/tutor.go` | ✅ Done |
| 7 | Register `GET /api/v1/history` in router | `internal/api/router.go` | ✅ Done |
| 8 | Test `/tutor` returns real integer scores via curl | — | ⬜ Verify |
| 9 | Test `/history` returns session array (not `null`) | — | ⬜ Verify |
| 10 | Verify DB rows have real integers, not `0` | MySQL `evaluations` table | ⬜ Verify |

---

### Key Decisions Made

- `cfg *config.Config` used instead of raw `apiKey string` in `TutorHandler` — consistent with other handlers
- Field named `Corrected_answer` (not `CorrectedText`) — must match in struct tag, system prompt JSON key, and handler field access
- `*int` / `*string` pointer types in `SessionRow` for nullable DB columns from `LEFT JOIN`
- `rows = []db.SessionRow{}` nil guard in `HistoryHandler` so JSON never returns `null`
- `LIMIT 20` on history query — pagination deferred to later

---

### Bugs Watched / Resolved

| Bug | Status |
|---|---|
| LLM adds preamble before JSON (`invalid character 'H'`) | ⬜ Watch |
| Score field name mismatch → silent `0` scores | ⬜ Watch |
| NULL scan panic on transcription-mode sessions | ✅ Handled via `*int` |
| History returns `null` instead of `[]` | ✅ Handled via nil guard |

---

### Test Commands

```powershell
# Start server
go run cmd/server/main.go

# Test tutor scores
curl.exe -X POST http://localhost:8080/api/v1/tutor `
  -H "Content-Type: application/json" `
  -d "{\"transcript\": \"I goes to store yesterday and buyed milk\", \"topic\": \"daily routine\"}"

# Test history
curl.exe http://localhost:8080/api/v1/history
```

```sql
-- Verify DB scores are real integers
USE s_peak;
SELECT grammar_score, fluency_score, content_score, overall_score, feedback
FROM evaluations ORDER BY id DESC LIMIT 3;
```

---

## ✅ Day 9 — Auth Foundation (Week 3 Starts)

**Goal:** Real user registration and login with bcrypt password hashing and JWT tokens. Replace all hardcoded `userID = 1` placeholders.

**~20 GitHub contributions**

---

### What Was Built

```
POST /api/v1/auth/register   →  hash password with bcrypt → insert into users table  ✅
POST /api/v1/auth/login      →  verify password → return signed JWT                  ✅
JWT middleware               →  token parsing + HS256 enforcement done                🔶 Partial
Protected routes             →  wiring deferred to Day 10                             ⬜
```

---

### Checklist

| # | Task | File | Status |
|---|---|---|---|
| 1 | Add `users` table migration | `schema.sql` | ✅ Done |
| 2 | Add `CreateUser` + `GetUserByEmail` to queries | `internal/db/queries.go` | ✅ Done |
| 3 | Install `golang.org/x/crypto/bcrypt` | `go.mod` | ✅ Done |
| 4 | Install `github.com/golang-jwt/jwt/v5` | `go.mod` | ✅ Done |
| 5 | Create `RegisterHandler` — hash password, insert user | `internal/api/handlers/auth.go` | ✅ Done |
| 6 | Create `LoginHandler` — verify password, return JWT | `internal/api/handlers/auth.go` | ✅ Done |
| 7 | JWT middleware — token parse + HS256 algorithm check | `internal/api/middleware/auth.go` | 🔶 Partial |
| 8 | JWT middleware — validity check + claims + context inject | `internal/api/middleware/auth.go` | ⬜ Carry over → Day 10 |
| 9 | Register auth routes in router | `internal/api/router.go` | ⬜ Carry over → Day 10 |
| 10 | Wrap protected routes with JWT middleware | `internal/api/router.go` | ⬜ Carry over → Day 10 |
| 11 | Replace hardcoded `1` in `TutorHandler` + `HistoryHandler` | `handlers/tutor.go`, `handlers/history.go` | ⬜ Carry over → Day 10 |
| 12 | Test register → login → token → history flow end-to-end | — | ⬜ Carry over → Day 10 |

---

### What's Done Inside `middleware/auth.go`

The security-critical section is complete:

```go
// ✅ Finished — this is the hard part
token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
    // Enforce HS256 — rejects the "alg: none" JWT attack
    if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
        return nil, jwt.ErrSignatureInvalid
    }
    return []byte(secret), nil
})

// ⬜ Left for Day 10 — 8 lines to finish
// if err != nil || !token.Valid { ... }
// claims extraction
// context.WithValue(r.Context(), UserIDKey, userID)
```

---

### Key Decisions Made

- bcrypt cost factor `12` — good balance of security vs response time
- Same error message for wrong email + wrong password — prevents email enumeration
- HS256 algorithm enforced explicitly — blocks `alg: none` JWT attack
- JWT expiry set to 24 hours
- `JWT_SECRET` read from env, never hardcoded
- Password minimum 8 characters enforced in handler

---

### Bugs to Watch on Day 10

| Risk | Where |
|---|---|
| `user_id` claim arrives as `float64` not `int` from JWT — need type assertion cast | `middleware/auth.go` claims extraction |
| Router group order matters — public routes must be registered before the protected group | `router.go` |
| Missing `Authorization` header returns vague error if not checked early | `middleware/auth.go` header check |

---

## 📋 Day 10 — Finish Middleware + Wire Auth + End-to-End Test

**Goal:** Complete the 8 remaining lines in `middleware/auth.go`, wire everything in the router, replace hardcoded `userID`, and do a full register → login → protected route test.

> See `day10.md` for full checklist and code.

---

## 🗓️ Overall Timeline

| Day | Focus | Status |
|---|---|---|
| 1 | Project structure, go module, config | ✅ Done |
| 2 | MySQL schema, DB connection | ✅ Done |
| 3 | Chi router, health endpoint, stubs | ✅ Done |
| 4 | Groq Whisper STT | ✅ Done |
| 5 | Groq Evaluator | ✅ Done |
| 6 | Text Enhancer + DB query helpers | ✅ Done |
| 7 | Wire router + main, end-to-end working | ✅ Done |
| 8 | Structured JSON scores, history endpoint | ✅ Done |
| **9** | Auth — DB, bcrypt, JWT generation, middleware partial | ✅ Done |
| **10** | Finish middleware, wire router, replace userID, E2E test | 📋 Next |
| Week 4 | Frontend — React setup, mic recorder, transcription screen | 📋 Upcoming |
| Week 5 | Frontend — Tutor Mode UI, History screen | 📋 Upcoming |
| Week 6 | Polish, deploy (Railway + Vercel), README, final testing | 📋 Upcoming |
