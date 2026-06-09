# S-PEAK — Day 3 Progress Log

> **Project:** S-PEAK (Speech Tutor App)
> **Date:** Day 3
> **Developer:** Saugat Tamang
> **Repo:** https://github.com/Saugat-Tamang17/S-PEAK

---

## ✅ What Was Accomplished Today

### 1. Chi Router and CORS Packages Installed
- Ran `go get github.com/go-chi/chi/v5` to install the Chi router
- Ran `go get github.com/go-chi/cors` to install the CORS middleware
- Both added to `go.mod` and `go.sum` automatically

### 2. Handler Folder Structure Created
- Created `internal/api/handlers/` directory
- Final handlers folder contains 3 files today (4th — `session.go` — comes in Week 3):

| File | Status | Purpose |
|---|---|---|
| `health.go` | ✅ Done | Server alive check — no DB |
| `transcription.go` | ✅ Stub | Placeholder for speech-to-text logic |
| `tutor.go` | ✅ Stub | Placeholder for tutor evaluation logic |
| `session.go` | ⏳ Week 3 | Will tie recordings to users via `sessions` table |

### 3. `internal/api/handlers/health.go` Written
- Returns `200 OK` with a JSON body `{"status":"ok","app":"S-PEAK"}`
- Sets `Content-Type: application/json` header
- No DB interaction — purely confirms the server is alive

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

### 4. `internal/api/handlers/transcription.go` Written (Stub)
- Returns a placeholder JSON message
- Will be replaced with real Groq STT logic in Week 2

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

### 5. `internal/api/handlers/tutor.go` Written (Stub)
- Same pattern as `transcription.go`
- Will be replaced with Groq evaluator logic in Week 2

```go
package handlers

import (
    "encoding/json"
    "net/http"
)

func TutorHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "message": "tutor endpoint — coming soon",
    })
}
```

### 6. `internal/api/router.go` Written
- Registered `middleware.Logger` — logs every incoming request
- Registered `middleware.Recoverer` — catches panics so the server doesn't crash
- Configured CORS to allow all origins (safe for development)
- Wired `/health` to `HealthHandler`
- Created `/api/v1` route group with `/transcription` and `/tutor`

```go
package api

import (
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/go-chi/cors"
    "github.com/Saugat-Tamang17/s-peak/internal/api/handlers"
)

func NewRouter() *chi.Mux {
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
        r.Get("/transcription", handlers.TranscribeHandler)
        r.Get("/tutor", handlers.TutorHandler)
    })

    return r
}
```

### 7. `cmd/server/main.go` Updated
- Added `api.NewRouter()` call after DB connection
- Added `http.ListenAndServe` to start the server on the configured port
- Server blocks and runs until killed

```go
// Day 3 addition — after defer database.Close()
router := api.NewRouter()

log.Printf("🚀 Server starting on port %s", cfg.Port)
if err := http.ListenAndServe(":"+cfg.Port, router); err != nil {
    log.Fatalf("❌ Server failed: %v", err)
}
```

### 8. All Endpoints Tested with curl

```powershell
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/transcription
curl http://localhost:8080/api/v1/tutor
```

**Final output:**
```
✅ Config loaded successfully
   DB Host     : localhost
   DB Port     : 3306
   DB Name     : s_peak
   Port        : 8080
   Groq API Key: NOT SET ⚠️
✅ Connected to MySQL successfully
🚀 Server starting on port 8080
```

**`/health` response:**
```json
{"app":"S-PEAK","status":"ok"}
```

**`/api/v1/transcription` response:**
```json
{"message":"transcription endpoint — coming soon"}
```

**`/api/v1/tutor` response:**
```json
{"message":"tutor endpoint — coming soon"}
```

### 9. Committed and Pushed
```bash
git add .
git commit -m "Day 3: Chi router, health endpoint, route stubs"
git push origin main
```

---

## ❌ Bugs Encountered and Fixed

### Bug 1 — `healthHandler` undefined
**Error:**
```
undefined: healthHandler
```
**Cause:** The Day 2 plan used lowercase `healthHandler` in `router.go` but the function in `health.go` is exported as `HealthHandler` (capital H)
**Fix:** Changed `r.Get("/health", healthHandler)` to `r.Get("/health", handlers.HealthHandler)` and added the handlers import
**Lesson:** Go only exports identifiers that start with a capital letter. Lowercase = package-private, uppercase = public.

### Bug 2 — `r.Mount` vs `r.Get` confusion
**Cause:** The Day 2 plan used `r.Mount("/transcription", transcriptionRouter())` which requires a separate sub-router function
**Fix:** Used `r.Get("/transcription", handlers.TranscribeHandler)` directly — simpler for single-route stubs
**Lesson:** Use `r.Mount` when a path group has multiple routes. Use `r.Get`/`r.Post` directly for single endpoints. Switch to `r.Mount` in Week 3 when handlers expand.

---

## 🧠 Key Concepts Learned Today

| Concept | What It Means |
|---|---|
| Chi router | Lightweight HTTP router for Go — handles URL patterns, method matching, and middleware |
| `r.Use()` | Registers middleware that wraps every request through that router |
| `r.Route()` | Creates a sub-router scoped to a path prefix — keeps routes organized |
| `r.Get()` / `r.Post()` | Registers a handler for a specific HTTP method and path |
| `r.Mount()` | Attaches a separate router at a path — use when a group has many routes |
| Middleware | A function that runs before/after every handler — used for logging, auth, CORS, panic recovery |
| CORS | Cross-Origin Resource Sharing — browsers block frontend JS from calling a different domain unless the server explicitly allows it |
| `http.ListenAndServe` | Starts the HTTP server and blocks forever (or until it crashes) |
| `json.NewEncoder(w).Encode(...)` | Writes a Go map or struct as a JSON response body |
| Stub handler | A placeholder handler returning dummy JSON — proves routing works before real logic exists |
| Exported vs unexported | Capital first letter = exported (public). Lowercase = unexported (package-private). |

---

## 📋 Day 4 Plan — Groq STT Integration (Speech-to-Text)

### Goal
By end of Day 4 you should have:
- A `internal/services/groq/` package set up
- A function that sends audio data to the Groq Whisper API and gets back a transcript
- The Groq API key loaded from `.env` and passed into the service
- A basic test confirming the transcription call works
- `TranscribeHandler` updated to call the real Groq service instead of returning a stub

---

### Step 1 — Set Your Groq API Key in `.env`

```env
GROQ_API_KEY=your_actual_key_here
```

Get your key from: https://console.groq.com/keys

---

### Step 2 — Create `internal/services/groq/transcribe.go`

This file handles the HTTP call to Groq's Whisper endpoint:

```go
package groq

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
)

const transcribeURL = "https://api.groq.com/openai/v1/audio/transcriptions"

type TranscribeResponse struct {
    Text string `json:"text"`
}

func Transcribe(apiKey string, audioData []byte, filename string) (string, error) {
    var body bytes.Buffer
    writer := multipart.NewWriter(&body)

    // Add the audio file field
    part, err := writer.CreateFormFile("file", filename)
    if err != nil {
        return "", fmt.Errorf("failed to create form file: %w", err)
    }
    part.Write(audioData)

    // Add the model field
    writer.WriteField("model", "whisper-large-v3")
    writer.Close()

    req, err := http.NewRequest("POST", transcribeURL, &body)
    if err != nil {
        return "", fmt.Errorf("failed to create request: %w", err)
    }

    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", writer.FormDataContentType())

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", fmt.Errorf("groq request failed: %w", err)
    }
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)

    var result TranscribeResponse
    if err := json.Unmarshal(respBody, &result); err != nil {
        return "", fmt.Errorf("failed to parse groq response: %w", err)
    }

    return result.Text, nil
}
```

---

### Step 3 — Update `TranscribeHandler` to Accept Audio

Update `internal/api/handlers/transcription.go` to:
- Accept a `POST` request with audio file in the body
- Call `groq.Transcribe()` with the audio bytes
- Return the transcript as JSON

```go
func TranscribeHandler(apiKey string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        r.ParseMultipartForm(10 << 20) // 10 MB max

        file, header, err := r.FormFile("audio")
        if err != nil {
            http.Error(w, "audio file required", http.StatusBadRequest)
            return
        }
        defer file.Close()

        audioBytes, _ := io.ReadAll(file)

        transcript, err := groq.Transcribe(apiKey, audioBytes, header.Filename)
        if err != nil {
            http.Error(w, "transcription failed", http.StatusInternalServerError)
            return
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{
            "transcript": transcript,
        })
    }
}
```

---

### Step 4 — Update `router.go` to Pass API Key

```go
// Pass apiKey into the handler
r.Post("/api/v1/transcription", handlers.TranscribeHandler(cfg.GroqAPIKey))
```

Note the method changes from `r.Get` to `r.Post` — transcription requires sending audio data.

---

### Step 5 — Test with curl

```powershell
curl -X POST http://localhost:8080/api/v1/transcription `
  -F "audio=@your_audio_file.mp3"
```

Expected response:
```json
{"transcript": "Hello, this is a test recording."}
```

---

### Step 6 — Commit
```bash
git add .
git commit -m "Day 4: Groq Whisper STT integration"
git push origin main
```

---

## 🧠 Concepts You Will Learn on Day 4

| Concept | What It Means |
|---|---|
| Groq Whisper API | Groq hosts OpenAI's Whisper model — send audio, get back text |
| `multipart/form-data` | The HTTP encoding used to send files in a POST request body |
| `multipart.NewWriter` | Go's way of building a multipart form body with file and text fields |
| `http.HandlerFunc` closure | Returning a handler from a function lets you inject dependencies (like `apiKey`) into it |
| `r.FormFile()` | Extracts an uploaded file from a multipart POST request |
| `io.ReadAll()` | Reads the entire body of a file or response into a `[]byte` |
| `fmt.Errorf("...: %w", err)` | Wraps an error with context — makes debugging easier |
| `r.Post()` vs `r.Get()` | GET for fetching data, POST for sending data (like audio files) |

---

## 🗓️ Overall Project Timeline (reference)

| Week | Focus |
|---|---|
| Week 1 | Setup, folder structure, config, MySQL, Router ✅ |
| Week 2 | Groq AI services (STT, Enhancer, Evaluator) ← You are here |
| Week 3 | REST API handlers + Chi router (full) |
| Week 4 | Frontend — mic recorder, Mode 1 |
| Week 5 | Frontend — Tutor Mode, History screen |
| Week 6 | Polish, deploy, README, final testing |
