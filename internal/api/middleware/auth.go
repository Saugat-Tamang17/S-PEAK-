package middleware

import (
	"net/http"
)

// not using stringdirectly to avoid context key collision //
type contextKey string

const UserIDKey contextKey = "user_id"

func JWTAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if !string.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "missing or malfunctioned tokens", http.StatusUnauthorized)
		}
	})
}
