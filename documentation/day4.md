# S-PEAK — Day 4 Progress Log

> **Project:** S-PEAK (Speech Tutor App)
> **Date:** Day 4 (+ Day 3 overflow bug session)
> **Developer:** Saugat Tamang
> **Repo:** https://github.com/Saugat-Tamang17/S-PEAK

---

## ✅ What Was Accomplished Today

### 1. `internal/services/groq/transcribe.go` Written
- Created `internal/services/groq/` directory and package
- Implemented `Transcribe(apiKey string, audioData []byte, filename string) (string, error)`
- Sends audio to Groq's Whisper endpoint via `multipart/form-data` POST
- Parses JSON response and returns the transcript text
- Added empty transcript guard — returns a descriptive error with raw response body for debugging

```go
package groq

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "log"
)

const transcribeURL = "https://api.groq.com/openai/v1/audio/transcriptions"

type TranscribeResponse struct {
    Text string `json:"text"`
}

func Transcribe(apiKey string, audioData []byte, filename string) (string, error) {
    var body bytes.Buffer
    writer := multipart.NewWriter(&body)

    part, err := writer.CreateFormFile("file", filename)
    if err != nil {
        return "", fmt.Errorf("failed to create form file: %w", err)
    }
    part.Write(audioData)

    writer.WriteField("model", "whisper-large-v3-turbo")
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

    if result.Text == "" {
        return "", fmt.Errorf("groq returned empty transcript — raw response: %s", string(respBody))
    }

    return result.Text, nil
}
```

### 2. `internal/api/handlers/transcription.go` Updated (Stub → Real)
- Replaced stub with a closure handler that accepts `apiKey string`
- Parses `multipart/form-data` POST with 10 MB limit
- Reads uploaded audio file bytes and passes to `groq.Transcribe()`
- Returns transcript as JSON

```go
package handlers

import (
    "encoding/json"
    "io"
    "log"
    "net/http"

    groq "github.com/Saugat-Tamang17/S-PEAK/internal/services/groq"
)

func TranscribeHandler(apiKey string) http.HandlerFunc {
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

        transcript, err := groq.Transcribe(apiKey, audioBytes, header.Filename)
        if err != nil {
            log.Printf("Transcription error: %v", err)
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

### 3. `internal/api/router.go` Updated
- `NewRouter()` → `NewRouter(groqAPIKey string)` to accept API key as parameter
- `/transcription` changed from `r.Get` → `r.Post` (sending audio requires POST)
- Removed `config` import from router — router stays decoupled from config
- `handlers.TranscribeHandler(groqAPIKey)` now called with injected key

```go
func NewRouter(groqAPIKey string) *chi.Mux {
    // ...
    r.Route("/api/v1", func(r chi.Router) {
        r.Post("/transcription", handlers.TranscribeHandler(groqAPIKey))
        r.Get("/tutor", handlers.TutorHandler)
    })
    return r
}
```

### 4. `cmd/server/main.go` Updated
- `api.NewRouter()` → `api.NewRouter(cfg.GROQAPIKEY)`

### 5. `config.go` Fixed
- `os.Getenv("GROQAPIKEY")` → `os.Getenv("GROQ_API_KEY")` to match `.env` key name

### 6. Transcription Tested Successfully with curl

```powershell
curl.exe -X POST http://localhost:8080/api/v1/transcription `
  -F "audio=@C:\...\test-audio\test.mp3"
```

**Response:**
```json
{"transcript":" Practice your English. I say red, you say blue. Hello, mate. I'm sorry, I didn't catch that. Speak up, I can't hear you."}
```

### 7. Committed and Pushed
```bash
git add .
git commit -m "Day 4: Groq Whisper STT integration working"
git push origin main
```

---

## ❌ Bugs Encountered and Fixed

### Bug 1 — Port 8080 already in use
**Error:**
```
Server Failed: listen tcp :8080: bind: Only one usage of each socket address
```
**Cause:** Old server process still running in background hogging the port
**Fix:**
```powershell
netstat -ano | findstr :8080
taskkill /PID <number> /F
```
**Lesson:** Always kill the old server before restarting. Use two split terminals — one for the server, one for curl.

### Bug 2 — `GROQAPIKEY` vs `GROQ_API_KEY` mismatch
**Cause:** `.env` had `GROQ_API_KEY` but `config.go` was reading `os.Getenv("GROQAPIKEY")` — they didn't match so the key loaded as empty string
**Fix:** Changed config to `os.Getenv("GROQ_API_KEY")`
**Lesson:** The env variable name in `os.Getenv()` must exactly match the key name in `.env` — case sensitive, underscores matter.

### Bug 3 — Bad struct tag syntax (THE real culprit)
**Error:** Linter warning: `struct field tag json:text not compatible with reflect.StructTag.Get`
**Cause:**
```go
Text string `json:text`    // ❌ missing quotes around value
Text string `json:"text"`  // ✅ correct
```
**Effect:** `json.Unmarshal` couldn't map Groq's `"text"` field to the struct, so `result.Text` was always empty — triggering the "empty transcript" error even when the API call succeeded
**Lesson:** Struct tags always need quoted values: `json:"fieldname"`. This was the root cause of hours of debugging — a one-character fix.

### Bug 4 — API key auto-revoked by Groq
**Cause:** Full API key was accidentally shared in a chat session — Groq's security system auto-revoked it
**Fix:** Generated a fresh key from https://console.groq.com/keys
**Lesson:** Never share or paste your API key publicly. Keep it only in `.env` which is in `.gitignore`.

### Bug 5 — PowerShell `curl` is not real curl
**Error:** `A parameter cannot be found that matches parameter name 'X'`
**Cause:** PowerShell's `curl` is an alias for `Invoke-WebRequest`, not the real curl binary
**Fix:** Use `curl.exe` instead of `curl` in PowerShell
**Lesson:** Always use `curl.exe` on Windows PowerShell for HTTP testing.

---

## 🧠 Key Concepts Learned Today

| Concept | What It Means |
|---|---|
| `multipart/form-data` | HTTP encoding for sending files in a POST body — required for audio uploads |
| `multipart.NewWriter` | Go's way of building a multipart form body with file and text fields |
| `http.HandlerFunc` closure | Returning a handler from a function lets you inject dependencies (like `apiKey`) into it |
| `r.FormFile()` | Extracts an uploaded file from a multipart POST request |
| `io.ReadAll()` | Reads the entire body of a file or response into `[]byte` |
| Struct tags | Backtick annotations on struct fields — must use quoted values: `json:"text"` not `json:text` |
| `json.Unmarshal` | Parses a JSON byte slice into a Go struct — fails silently if struct tags are malformed |
| `r.Post()` vs `r.Get()` | GET for fetching data, POST for sending data (like audio files) |
| Dependency injection via closure | Pass config values into handlers through function parameters, not global state |
| `os.Getenv()` is exact match | Key names in `.env` and `os.Getenv()` must match exactly — no fuzzy matching |
| `curl.exe` on Windows | PowerShell's `curl` alias doesn't support `-X`, `-F` flags — always use `curl.exe` |

---

## 📋 Day 5 Plan — Groq LLM Tutor Evaluator

### Goal
By end of Day 5 you should have:
- A `internal/services/groq/evaluate.go` package that sends a transcript to Groq's LLM
- The LLM evaluates the speech for grammar, clarity, and fluency
- Returns structured feedback as JSON
- `TutorHandler` updated to call the real evaluator instead of returning a stub

---

### Step 1 — Create `internal/services/groq/evaluate.go`

```go
package groq

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const chatURL = "https://api.groq.com/openai/v1/chat/completions"

type EvaluateResponse struct {
    Choices []struct {
        Message struct {
            Content string `json:"content"`
        } `json:"message"`
    } `json:"choices"`
}

func Evaluate(apiKey string, transcript string) (string, error) {
    payload := map[string]interface{}{
        "model": "llama3-8b-8192",
        "messages": []map[string]string{
            {
                "role":    "system",
                "content": "You are an English speech tutor. Evaluate the following transcript for grammar, clarity, and fluency. Give specific, actionable feedback.",
            },
            {
                "role":    "user",
                "content": transcript,
            },
        },
    }

    body, _ := json.Marshal(payload)

    req, err := http.NewRequest("POST", chatURL, bytes.NewBuffer(body))
    if err != nil {
        return "", fmt.Errorf("failed to create request: %w", err)
    }

    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", fmt.Errorf("groq request failed: %w", err)
    }
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)

    var result EvaluateResponse
    if err := json.Unmarshal(respBody, &result); err != nil {
        return "", fmt.Errorf("failed to parse groq response: %w", err)
    }

    if len(result.Choices) == 0 {
        return "", fmt.Errorf("groq returned no choices — raw response: %s", string(respBody))
    }

    return result.Choices[0].Message.Content, nil
}
```

---

### Step 2 — Update `TutorHandler` in `tutor.go`

Similar closure pattern to `TranscribeHandler`:

```go
func TutorHandler(apiKey string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var input struct {
            Transcript string `json:"transcript"`
        }
        json.NewDecoder(r.Body).Decode(&input)

        if input.Transcript == "" {
            http.Error(w, "transcript required", http.StatusBadRequest)
            return
        }

        feedback, err := groq.Evaluate(apiKey, input.Transcript)
        if err != nil {
            log.Printf("Evaluation error: %v", err)
            http.Error(w, "evaluation failed", http.StatusInternalServerError)
            return
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{
            "feedback": feedback,
        })
    }
}
```

---

### Step 3 — Update `router.go`

```go
r.Post("/tutor", handlers.TutorHandler(groqAPIKey))
```

---

### Step 4 — Test with curl

```powershell
curl.exe -X POST http://localhost:8080/api/v1/tutor `
  -H "Content-Type: application/json" `
  -d "{\"transcript\": \"I goes to the store yesterday and buyed some milk.\"}"
```

Expected: JSON feedback pointing out grammar errors and suggestions.

---

## 🗓️ Overall Project Timeline (reference)

| Week | Focus |
|---|---|
| Week 1 | Setup, folder structure, config, MySQL, Router ✅ |
| Week 2 | Groq AI services (STT ✅, Evaluator ← Day 5) |
| Week 3 | REST API handlers + Chi router (full) |
| Week 4 | Frontend — mic recorder, Mode 1 |
| Week 5 | Frontend — Tutor Mode, History screen |
| Week 6 | Polish, deploy, README, final testing |
