package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	"github.com/Saugat-Tamang17/S-PEAK/internal/db"
	groq "github.com/Saugat-Tamang17/S-PEAK/internal/services/groq"
)

func TutorHandler(cfg *config.Config, database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var input struct {
			Transcript string `json:"transcript"`
			Topic      string `json:"topic"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "transcript required", http.StatusBadRequest)
			return
		}

		feedbackRaw, err := groq.Evaluate(cfg, input.Transcript, input.Topic)
		if err != nil {
			log.Printf("Evaluation error: %v", err)
			http.Error(w, "evaluation failed", http.StatusInternalServerError)
			return
		}

		// Save to DB — same hardcoded userID=1 placeholder
		sessionID, err := db.CreateSession(database, 1, "tutor")
		if err != nil {
			log.Printf("DB session error: %v", err)
		} else {
			transcriptID, err := db.SaveTranscript(database, sessionID, input.Transcript, input.Transcript)
			if err != nil {
				log.Printf("DB transcript error: %v", err)
			} else {
				// feedbackRaw is the raw LLM string for now
				// parsed scores come in a future day when you make the LLM return JSON
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
