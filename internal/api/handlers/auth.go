package handlers

import (
	"database/sql"
)

type AuthHandler struct {
	DB *sql.DB
}

type authRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
