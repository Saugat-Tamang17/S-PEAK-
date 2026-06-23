package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	"github.com/Saugat-Tamang17/S-PEAK/internal/api/middleware"
	"github.com/Saugat-Tamang17/S-PEAK/internal/db"
	groq "github.com/Saugat-Tamang17/S-PEAK/internal/services/groq"
)

func TutorHandler(cfg *config.Config, database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(middleware.UserIDKey).(int)
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var input struct {
			Transcript string `json:"transcript"`
			Topic      string `json:"topic"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "transcript required", http.StatusBadRequest)
			return
		}

		// 1. Only call the Groq AI service ONCE
		result, err := groq.Evaluate(cfg, input.Transcript, input.Topic)
		if err != nil {
			log.Printf("Evaluate error: %v", err)
			http.Error(w, "evaluation failed", http.StatusInternalServerError)
			return
		}

		// 2. Run your database inserts safely using the 'result' object
		sessionID, err := db.CreateSession(database, userID, "tutor") // Hardcoded user_id 1 for now
		if err != nil {
			log.Printf("CreateSession error: %v", err)
		}

		transcriptID, err := db.SaveTranscript(database, sessionID, input.Transcript, result.Corrected_answer)
		if err != nil {
			log.Printf("SaveTranscript error: %v", err)
		}

		if err := db.SaveEvaluation(database, transcriptID, input.Topic,
			result.ContentScore, result.FluencyScore, result.GrammarScore, result.OverallScore,
			result.Feedback, result.Corrected_answer,
		); err != nil {
			log.Printf("SaveEvaluation error: %v", err)
		}

		// 3. Return the evaluation results directly back to the client
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(result); err != nil {
			log.Printf("Failed to encode response: %v", err)
		}
	}
}
