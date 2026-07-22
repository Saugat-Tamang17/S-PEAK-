package handlers

import (
	"database/sql"
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
	}
}
