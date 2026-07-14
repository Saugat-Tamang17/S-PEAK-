package db

import (
	"context"
	"database/sql"
	"log"
	"time"
)

type User struct {
	ID           int
	Name         string
	Email        string
	PasswordHash string
	GoogleID     string
}

func CreateUser(ctx context.Context, db *sql.DB, name, email, hashedPassword string) error {
	_, err := db.ExecContext(ctx, "INSERT INTO users (email, password_hash) VALUES(?, ?)", email, hashedPassword)
	if err != nil {
		return err
	}
	return nil
}
func GetUserByEmail(ctx context.Context, db *sql.DB, email string) (*User, error) {
	row := db.QueryRowContext(ctx, "SELECT id, email, COALESCE(password_hash, ''), COALESCE(google_id, '') FROM users WHERE email = ?", email)
	u := &User{}
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GoogleID)
	if err == sql.ErrNoRows {
		return nil, nil // not found, not an error
	}
	return u, err
}

func GetUserByGoogleID(ctx context.Context, db *sql.DB, googleID string) (*User, error) {
	row := db.QueryRowContext(ctx, "SELECT id, email, COALESCE(password_hash, ''), COALESCE(google_id, '') FROM users WHERE google_id = ?", googleID)
	u := &User{}
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GoogleID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func CreateGoogleUser(ctx context.Context, db *sql.DB, email, googleID string) error {
	_, err := db.ExecContext(ctx, "INSERT INTO users (email, google_id) VALUES (?, ?)", email, googleID)
	return err
}

func LinkGoogleID(ctx context.Context, db *sql.DB, userID int, googleID string) error {
	_, err := db.ExecContext(ctx, "UPDATE users SET google_id = ? WHERE id = ?", googleID, userID)
	return err
}

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

// SaveEvaluation inserts tutor mode scores and feedback.
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

// this is for the session history //
type SessionRow struct {
	SessionId    int64     `json:"session_id"`
	Mode         string    `json:"mode"`
	CreatedAt    time.Time `json:"created_at"`
	RawText      string    `json:"raw_text"`
	EnhancedText string    `json:"enhanced_text"`

	//pointer to the enhanced mode , null if its in raw transcription mode //
	GrammarScore *int    `json:"grammer-score"`
	FluencyScore *int    `json:"fluency_score"`
	ContentScore *int    `json:"content_score"`
	OverallScore *int    `json:"overall_score"`
	Feedback     *string `json:"feedback"`
}

func GetSessionHistory(database *sql.DB, userID int) ([]SessionRow, error) {
	query := `
		SELECT 
		s.id,s.mode,s.created_at,
		t.raw_text,t.enhanced_text,
		e.grammar_score,e.fluency_score,e.content_score,e.overall_score,e.feedback
		from sessions s
join transcripts t on t.session_id=s.id
left join evaluations e on e.transcript_id=t.id
		where s.user_id=?
		  ORDER BY s.created_at DESC
        LIMIT 20
		`

	rows, err := database.Query(query, userID)
	if err != nil {
		log.Printf("GetSessionHistory error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var result []SessionRow
	for rows.Next() {
		var r SessionRow
		err := rows.Scan(
			&r.SessionId, &r.Mode, &r.CreatedAt,
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
