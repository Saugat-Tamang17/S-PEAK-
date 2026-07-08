# S-PEAK — Project Brief

> **What it is:** A speech tutor web app. A user speaks (or types) something, the app transcribes it, and an AI evaluator scores their grammar, fluency, and content — then gives corrected, encouraging feedback. Think of it as a low-pressure speaking coach: practice out loud, get a real score, see it improve over time.
>
> **Who it's for:** People practicing spoken English (e.g. exam prep, interview prep, general fluency practice) who want quick, judgment-free feedback instead of a full tutor session.
>
> **This document exists to brief a design tool (Stitch) on what screens are needed and why — not to specify visuals. Treat every "screen" section below as functional requirements only.**

---

## Tech stack (backend — done)

| Layer | Choice |
|---|---|
| Language | Go |
| Router | Chi |
| Database | MySQL |
| Speech-to-text | Groq (Whisper) |
| Evaluation / scoring | Groq LLM, JSON-mode output, temperature 0.2 |
| Auth | bcrypt (password hashing) + JWT (HS256) |
| Config | Environment variables (`.env`), never hardcoded secrets |

---

## What the backend does, end to end

1. **A user speaks** — audio gets sent to the backend.
2. **Groq Whisper transcribes it** into text.
3. **The transcript is evaluated** by a Groq LLM call that returns structured JSON: a grammar score, fluency score, content score, an overall score, a corrected version of the sentence, and written feedback.
4. **The result is saved** to MySQL, tied to the logged-in user.
5. **The user can look back** at a history of past sessions and scores.
6. **Everything is gated behind login** — no anonymous usage; a JWT identifies who's talking.

There are two "modes" implied by the data model and worth designing for separately:
- **Tutor mode** — full evaluation flow: transcript in, scores + corrected text + feedback out.
- **Transcription-only mode** — just converts speech to text, no scoring (this is why score fields in the DB are nullable — some sessions have no scores by design, not by bug).

---

## Features (what's actually built vs. what's left)

### ✅ Done — Core speech loop
- Speech-to-text via Groq Whisper
- AI evaluator returns **real structured scores** (not placeholder zeros): grammar, fluency, content, overall
- Evaluator forced into strict JSON output (temperature 0.2 + JSON-only system prompt) so the app can reliably parse it
- Corrected-sentence output alongside the raw transcript
- Written feedback text per session

### ✅ Done — Data + history
- MySQL schema for sessions/evaluations
- `GET /api/v1/history` — returns a user's past sessions as a list (never `null`, always at least `[]`)
- History is paginated at `LIMIT 20` (no infinite scroll / page controls yet — deferred)
- Handles sessions that have no score (transcription-only) without crashing, via nullable fields

### ✅ Done — Authentication
- `POST /api/v1/auth/register` — email + password (min. 8 characters), password hashed with bcrypt (cost factor 12)
- `POST /api/v1/auth/login` — verifies password, returns a signed JWT (24-hour expiry)
- Same error message for "wrong email" and "wrong password" — deliberately prevents attackers from discovering which emails are registered
- JWT signing algorithm is locked to HS256 to block a known attack (`"alg": "none"`) where a forged token skips signature verification entirely

### 🔶 In progress — Auth wiring
- JWT parsing + algorithm enforcement is done
- Still to finish: validity/expiry check, extracting the user ID from the token, and actually protecting routes with it (currently all routes still act as if a single hardcoded user is logged in — real per-user data isolation is the next milestone, not yet live)

### 📋 Not started
- Replacing the hardcoded placeholder user ID with the real logged-in user everywhere
- Full end-to-end test of register → login → protected action
- Everything frontend (this is where we are now)

---

## API surface (what the frontend will call)

| Method | Path | Purpose | Auth required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Create an account | No |
| `POST` | `/api/v1/auth/login` | Log in, get a JWT | No |
| `POST` | `/api/v1/tutor` | Submit a transcript, get scores + corrected text + feedback | Yes (soon) |
| `GET` | `/api/v1/history` | List past sessions | Yes (soon) |

*(A dedicated speech-to-text endpoint for uploading raw audio is implied by the Whisper integration but isn't listed as a separate route in the tracker — confirm the exact path before wiring the recorder screen.)*

---

## Data shapes the frontend will work with

**A session / evaluation result:**
- Transcript (what the user said)
- Corrected version of the transcript
- Grammar score (integer)
- Fluency score (integer)
- Content score (integer)
- Overall score (integer)
- Feedback (free text)
- Scores may be `null` on transcription-only sessions — the UI needs a state for "no score, just a transcript"

**A user:**
- Email
- (Password never touches the frontend beyond the login/register form)

---

## Implied screens (functional list for Stitch, not final UX)

1. **Register** — email + password form, min. 8 characters, single generic error state for any failure
2. **Login** — email + password form, same generic error state (don't leak whether the email exists)
3. **Recording / Tutor screen** — the core loop: user speaks (needs a mic-recording interaction), sees it get transcribed, submits for evaluation, sees scores + corrected text + feedback come back. Needs a clear "in progress" state while waiting on the AI call, since evaluation isn't instant.
4. **Transcription-only screen (Enhanced/quick mode)** — lighter version of #3: speak, get text back, no scoring. Needs to be visually distinct from full Tutor mode so users know which mode they're in.
5. **History screen** — list of past sessions, each showing transcript + scores (or "no score" state for transcription-only entries). This is naturally a list/table of records over time — design it as a real timeline of practice sessions, not a generic table.
6. **Empty states matter here** — a brand-new user's History screen has zero sessions. That's a "go practice for the first time" moment, not just a blank table.

---

## Tone / product feel (for copy and interaction design)

- This is a **practice space, not an exam.** Scores should read as encouraging and constructive, never punitive — the user is a learner, not being graded harshly.
- Errors and feedback should be specific and plain-spoken ("Try using past tense here" beats "Grammar error detected").
- Because the core interaction is *speaking out loud*, the recording state (listening / processing / done) needs to be unmistakable — the user should never wonder if the mic is on.

---

## Known constraints for design/build

- Password minimum is 8 characters — surface this in the form, don't let users find out only after submitting.
- JWT lives for 24 hours — a "logged out, please log in again" state is a real scenario, not an edge case.
- History is capped at the 20 most recent sessions for now — no pagination UI needed yet, but don't design as if the list is infinite.
