# S-PEAK — Day 1 Progress Log

> **Project:** S-PEAK (Speech Tutor App)
> **Date:** Day 1
> **Developer:** Saugat Tamang
> **Repo:** https://github.com/Saugat-Tamang17/S-PEAK

---

## ✅ What Was Accomplished Today

### 1. Repository Created
- Created GitHub repo `S-PEAK`
- Cloned locally and set up as working directory

### 2. Folder Structure Created
The full project skeleton was created using `mkdir -p` and `touch`:

```
S-PEAK/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── transcription.go
│   │   │   ├── tutor.go
│   │   │   └── session.go
│   │   ├── middleware/
│   │   │   └── cors.go
│   │   └── router.go
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 001_init.sql
│   │   └── mysql.go
│   ├── models/
│   │   ├── session.go
│   │   ├── transcript.go
│   │   └── evaluation.go
│   └── services/
│       ├── stt.go
│       ├── enhancer.go
│       └── evaluator.go
├── config/
│   └── config.go
├── .env
├── .gitignore
├── go.mod
├── go.sum
└── README.md
```

### 3. Go Module Initialized
```bash
go mod init github.com/Saugat-Tamang17/S-PEAK
```

> **Bug fixed:** Module was accidentally initialized as `github.com/Saugat-Tamang17/S-PEAK-.git`
> (the `.git` suffix was copied from the GitHub clone URL).
> Fixed by editing `go.mod` first line — no effect on Git tracking.

### 4. All Dependencies Installed
```bash
go get github.com/go-chi/chi/v5
go get github.com/go-chi/cors
go get github.com/go-sql-driver/mysql
go get github.com/joho/godotenv
go get github.com/google/uuid
```

All packages resolved and written to `go.sum` automatically.

### 5. `.env` File Created
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=speaksmart

GROQ_API_KEY=gsk_yourkeyhere

PORT=8080
```
> Groq API key is a placeholder for now — will be filled on Day 8.

### 6. `.gitignore` Created
```
.env
```
> Critical — prevents the API key and DB password from ever being pushed to GitHub.

### 7. `config/config.go` Written
- Single `GroqAPIKey` field (not split into OpenAI/Anthropic keys like the original guide — corrected)
- Loads from `.env` using `godotenv`
- Falls back to real environment variables if `.env` is absent (production-safe)
- Warns loudly if `GROQ_API_KEY` or `DB_HOST` are missing

### 8. `cmd/server/main.go` Written
- Loads config and prints each value to confirm everything is wired correctly
- Prints `SET ✅` or `NOT SET ⚠️` for the API key — never prints the key itself (security)

### 9. Verified Running
```bash
go run cmd/server/main.go
```

**Output:**
```
✅ Config loaded successfully
   DB Host     : localhost
   DB Port     : 3306
   DB Name     : speaksmart
   Port        : 8080
   Groq API Key: NOT SET ⚠️
Day 1 complete. Nothing is running yet — that comes later.
```
> `NOT SET` for Groq key is expected — placeholder value in `.env` for now.

### 10. Committed and Pushed to GitHub
```bash
git add .
git commit -m "Day 1: project structure, go module, config loader"
git push origin main
```

---

## 🧠 Key Concepts Learned Today

| Concept | What It Means |
|---|---|
| `go mod init` | Initializes a Go module — sets the import path prefix for all internal packages |
| `go get` | Downloads and registers a dependency into `go.mod` and `go.sum` |
| `go.sum` | Auto-generated checksum file — never edit manually |
| `godotenv` | Reads `.env` file and loads key=value pairs into `os.Getenv()` |
| `.gitignore` | Tells Git which files to never track — critical for secrets like `.env` |
| Module name | Must match exactly in `go.mod` and all internal imports — `.git` suffix breaks it |
| Groq vs Grok | Groq = fast inference platform (what we use). Grok = X/Twitter's chatbot. Different things. |
| Groq free tier | Covers Whisper large-v3 (STT) + LLaMA 3.3 70B (LLM) — more than enough for development |
| LLaMA 3.3 70B | 70 billion parameter model hosted on Groq's servers — your PC only sends HTTP requests |

---

## ❌ Bugs Encountered and Fixed

### Bug 1 — Wrong module name
**Error:**
```
could not import github.com/Saugat-Tamang17/S-PEAK/config
(no required module provides package)
```
**Cause:** `go.mod` had `module github.com/Saugat-Tamang17/S-PEAK-.git`
**Fix:** Removed `.git` suffix from the module line in `go.mod`
**Lesson:** Always use the repo name, not the clone URL, when running `go mod init`

---

## 📋 Day 2 Plan — MySQL: Install, Schema, Connect

### Goal
By end of Day 2 you should have:
- MySQL installed and running on your machine
- A database called `speaksmart` created
- All 4 tables created by running the migration SQL file
- A working Go DB connection in `internal/db/mysql.go`
- A test ping in `main.go` that confirms Go can talk to MySQL

---

### Step 1 — Install MySQL

**On Windows:**
Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/
Run the installer, choose "Developer Default", set a root password, remember it.

**On Ubuntu/Debian Linux:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

**On Mac:**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

Verify it's running:
```bash
mysql -u root -p
# enter your password — if you see mysql> prompt, you're in
```

---

### Step 2 — Create the Database

Inside the MySQL prompt:
```sql
CREATE DATABASE speaksmart;
USE speaksmart;
```

Then update your `.env` file:
```env
DB_PASSWORD=the_password_you_just_set
DB_NAME=speaksmart
```

---

### Step 3 — Write the Migration File

Open `internal/db/migrations/001_init.sql` and write all 4 tables:

```sql
-- 001_init.sql
-- Run this once to set up the full database schema for S-PEAK

CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(36)  PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- sessions ties every recording to a user and a mode
-- mode is either 'transcription' or 'tutor'
CREATE TABLE IF NOT EXISTS sessions (
    id         VARCHAR(36) PRIMARY KEY,
    user_id    VARCHAR(36) NOT NULL,
    mode       VARCHAR(20) NOT NULL,
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- transcripts stores what was said (raw from Whisper, enhanced by LLaMA)
CREATE TABLE IF NOT EXISTS transcripts (
    id            VARCHAR(36)  PRIMARY KEY,
    session_id    VARCHAR(36)  NOT NULL,
    raw_text      TEXT         NOT NULL,
    enhanced_text TEXT         NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- evaluations stores tutor mode scores and feedback (linked to a transcript)
CREATE TABLE IF NOT EXISTS evaluations (
    id               VARCHAR(36) PRIMARY KEY,
    transcript_id    VARCHAR(36) NOT NULL,
    topic            VARCHAR(500) NOT NULL,
    content_score    INT NOT NULL,
    fluency_score    INT NOT NULL,
    grammar_score    INT NOT NULL,
    overall_score    INT NOT NULL,
    feedback         TEXT NOT NULL,
    corrected_answer TEXT NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id)
);
```

Run it inside MySQL:
```bash
mysql -u root -p speaksmart < internal/db/migrations/001_init.sql
```

Verify tables were created:
```sql
USE speaksmart;
SHOW TABLES;
-- should show: users, sessions, transcripts, evaluations

DESCRIBE sessions;
-- should show all columns with their types
```

---

### Step 4 — Write `internal/db/mysql.go`

This file is responsible for one thing only: opening and returning a working `*sql.DB` connection.

```go
package db

import (
    "database/sql"
    "fmt"
    "log"

    _ "github.com/go-sql-driver/mysql"  // blank import — registers the mysql driver
)

// Connect opens a MySQL connection using the values from config.
// It also calls Ping() to confirm the connection actually works.
// Returns *sql.DB which is safe for concurrent use — it's a connection pool.
func Connect(host, port, user, password, name string) (*sql.DB, error) {

    // DSN = Data Source Name — the connection string MySQL expects
    // format: user:password@tcp(host:port)/dbname?parseTime=true
    // parseTime=true tells the driver to convert TIMESTAMP columns into Go time.Time
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
        user, password, host, port, name,
    )

    db, err := sql.Open("mysql", dsn)
    if err != nil {
        // sql.Open doesn't actually connect — it just validates the DSN format
        return nil, fmt.Errorf("failed to open db: %w", err)
    }

    // Ping is what actually tries to connect
    if err := db.Ping(); err != nil {
        return nil, fmt.Errorf("failed to ping db: %w", err)
    }

    // Connection pool settings — good defaults for a small app
    db.SetMaxOpenConns(10)   // max 10 simultaneous connections
    db.SetMaxIdleConns(5)    // keep 5 idle connections ready
    
    log.Println("✅ Connected to MySQL successfully")
    return db, nil
}
```

> **Why blank import?** `_ "github.com/go-sql-driver/mysql"` — the underscore means we don't use
> any exported names from this package directly. We import it purely so it runs its `init()`
> function, which registers "mysql" as a driver with Go's `database/sql` package.
> Without this, `sql.Open("mysql", ...)` would panic with "unknown driver".

---

### Step 5 — Update `cmd/server/main.go`

Add the DB connection test:

```go
package main

import (
    "fmt"
    "log"

    "github.com/Saugat-Tamang17/S-PEAK/config"
    "github.com/Saugat-Tamang17/S-PEAK/internal/db"
)

func main() {
    cfg := config.Load()

    fmt.Println("✅ Config loaded successfully")
    fmt.Printf("   DB Host     : %s\n", cfg.DBHost)
    fmt.Printf("   DB Port     : %s\n", cfg.DBPort)
    fmt.Printf("   DB Name     : %s\n", cfg.DBName)
    fmt.Printf("   Port        : %s\n", cfg.Port)

    if cfg.GroqAPIKey != "" {
        fmt.Println("   Groq API Key: SET ✅")
    } else {
        fmt.Println("   Groq API Key: NOT SET ⚠️")
    }

    // Day 2 addition — test the database connection
    database, err := db.Connect(
        cfg.DBHost,
        cfg.DBPort,
        cfg.DBUser,
        cfg.DBPassword,
        cfg.DBName,
    )
    if err != nil {
        log.Fatalf("❌ Database connection failed: %v", err)
    }
    defer database.Close()

    fmt.Println("Day 2 complete. Config + DB both working.")
}
```

Run it:
```bash
go run cmd/server/main.go
```

Expected output:
```
✅ Config loaded successfully
   DB Host     : localhost
   DB Port     : 3306
   DB Name     : speaksmart
   Port        : 8080
   Groq API Key: NOT SET ⚠️
✅ Connected to MySQL successfully
Day 2 complete. Config + DB both working.
```

---

### Step 6 — Commit

```bash
git add .
git commit -m "Day 2: MySQL schema, db connection, ping test"
git push origin main
```

---

## 🧠 Concepts You Will Learn on Day 2

| Concept | What It Means |
|---|---|
| `database/sql` | Go's standard library interface for SQL databases — works with any driver |
| DSN | Data Source Name — the connection string that tells Go where MySQL is and how to auth |
| `sql.Open` vs `db.Ping()` | `Open` just parses the DSN. `Ping` actually connects. Always call both. |
| Blank import `_` | Imports a package only for its side effects (registering the MySQL driver) |
| Connection pool | `*sql.DB` manages multiple connections automatically — you don't open/close per query |
| Foreign keys | `FOREIGN KEY (session_id) REFERENCES sessions(id)` — enforces that a transcript can't exist without a valid session |
| `parseTime=true` | DSN option that makes the MySQL driver convert `TIMESTAMP` columns to Go `time.Time` |
| Migration file | A `.sql` file you run once to set up your schema — version controlled so teammates can reproduce your DB |

---

## 🗓️ Overall Project Timeline (reference)

| Week | Focus |
|---|---|
| Week 1 | Setup, folder structure, config, MySQL |
| Week 2 | Groq AI services (STT, Enhancer, Evaluator) |
| Week 3 | REST API handlers + Chi router |
| Week 4 | Frontend — mic recorder, Mode 1 |
| Week 5 | Frontend — Tutor Mode, History screen |
| Week 6 | Polish, deploy, README, final testing |
