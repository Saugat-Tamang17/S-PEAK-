package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	"github.com/Saugat-Tamang17/S-PEAK/internal/db"
	"google.golang.org/api/idtoken"
)

type googleAuthRequest struct {
	IDToken string `json:"id_token"`
}

// GoogleAuthHandler accepts a Google ID token from the frontend, verifies
// it via google.golang.org/api/idtoken (handles JWKS fetching/caching,
// signature, issuer, audience, and expiry checks for us), then either logs
// in an existing user (matched by google_id, or by email to link an
// existing password account) or creates a new user. It issues an S-PEAK
// JWT identical in shape to Login()'s response.
func GoogleAuthHandler(cfg *config.Config, database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if cfg.GoogleClientID == "" {
			log.Println("Google auth attempted but GOOGLE_CLIENT_ID is not set")
			http.Error(w, "google sign-in is not configured", http.StatusInternalServerError)
			return
		}

		var req googleAuthRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.IDToken == "" {
			http.Error(w, "id_token required", http.StatusBadRequest)
			return
		}

		ctx := r.Context()

		// Validate() checks signature (against Google's live JWKS), issuer,
		// audience match, and expiry — all in one call.
		payload, err := idtoken.Validate(ctx, req.IDToken, cfg.GoogleClientID)
		if err != nil {
			log.Printf("Google id token verification failed: %v", err)
			http.Error(w, "invalid google token", http.StatusUnauthorized)
			return
		}

		emailVerified, _ := payload.Claims["email_verified"].(bool)
		email, _ := payload.Claims["email"].(string)
		name, _ := payload.Claims["name"].(string)
		googleID := payload.Subject

		if !emailVerified || email == "" || googleID == "" {
			http.Error(w, "google account missing required info", http.StatusUnauthorized)
			return
		}
		if name == "" {
			name = email
		}

		// 1. Already linked to this Google account?
		user, err := db.GetUserByGoogleID(ctx, database, googleID)
		if err != nil {
			log.Printf("GetUserByGoogleID error: %v", err)
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		if user == nil {
			// 2. Existing password account with the same email? Link it.
			existing, err := db.GetUserByEmail(ctx, database, email)
			if err != nil {
				log.Printf("GetUserByEmail error: %v", err)
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}

			if existing != nil {
				if err := db.LinkGoogleID(ctx, database, existing.ID, googleID); err != nil {
					log.Printf("LinkGoogleID error: %v", err)
					http.Error(w, "internal error", http.StatusInternalServerError)
					return
				}
				existing.GoogleID = googleID
				user = existing
			} else {
				// 3. Brand new user.
				// NOTE: assign into the outer `user`/`err` here — do NOT use
				// `:=`, or this shadows the outer variables and `user` stays
				// nil, causing a nil-pointer panic at generateJWT(user.ID)
				// below for every new Google sign-up.
				if err = db.CreateGoogleUser(ctx, database, name, email, googleID); err != nil {
					log.Printf("CreateGoogleUser error: %v", err)
					http.Error(w, "could not create account", http.StatusInternalServerError)
					return
				}
				user, err = db.GetUserByGoogleID(ctx, database, googleID)
				if err != nil || user == nil {
					log.Printf("post-create lookup error: %v", err)
					http.Error(w, "internal error", http.StatusInternalServerError)
					return
				}
			}
		}

		token, err := generateJWT(user.ID)
		if err != nil {
			log.Printf("JWT generation error: %v", err)
			http.Error(w, "server token error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"token": token, "name": user.Name})
	}
}
