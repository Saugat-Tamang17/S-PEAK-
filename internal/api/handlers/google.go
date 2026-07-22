package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/config"
)

type googleAuthRequest struct {
	IDtoken string `json:"id_token"`
}

func GoogleAuthHandler(cfg *config.Config, database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if cfg.GoogleClientID == "" {
			log.Println("google auth attempted but GOOGLECLIENT_ID isnt set")
			http.Error(w, "google sign-in is not configured", http.StatusInternalServerError)
			return
		}
		var req googleAuthRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.IDtoken == "" {
			http.Error(w, "id_token_required", http.StatusBadRequest)
		}
	}
}
