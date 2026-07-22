package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"google.golang.org/api/idtoken"

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
			return
		}
		ctx := r.Context()
		// Validate() checks signature (against Google's live JWKS), issuer,
		// audience match, and expiry — all in one cal
		payload, err := idtoken.Validate(ctx, req.IDtoken, cfg.GoogleClientID)
		if err != nil {
			log.Printf("google id verification failed : %v", err)
			http.Error(w, "invalid google token", http.StatusUnauthorized)
			return
		}

		emailverified, _ := payload.Claims["email_verified"].(bool)
		email, _ := payload.Claims["email"].(string)
		name, _ := payload.Claims["name"].(string)
		googleID, _ := payload.Subject
		if !emailVerified || email == "" || googleID == "" {
			http.Error(w, "google account missing required info", http.StatusUnauthorized)
			return
		}
		if name == "" {
			name = email
		}
	}
}
