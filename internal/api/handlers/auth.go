package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/internal/db"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB *sql.DB
}

type authRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "email and password required", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 8 {
		http.Error(w, "Password must be at least of 8 characters.", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		http.Error(w, "internal error :(", http.StatusInternalServerError)
		return
	}

	if err := db.CreateUser(r.Context(), h.DB, req.Email, string(hash)); err != nil {
		http.Error(w, "email already registered", http.StatusConflict)
		return
	}
}
