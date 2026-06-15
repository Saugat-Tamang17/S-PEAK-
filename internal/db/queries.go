package db

import (
	"database/sql"
	"time"
)

func CreateSession(db *sql.DB, userID int, mode string) (int64, error) {
	result, err := db.Exec(
		`INSERT INTO sessions(user_id,mode,created_at) VALUES (?,?,?)`, userID, mode, time.Now(),
	) //btw ? symbols are kind of like placeholders , used for preventing sql injections //
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// everytime user finishes transcribing and enhancing , we treat it as new event and store it in a record in transcript table for trackbacking //
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
