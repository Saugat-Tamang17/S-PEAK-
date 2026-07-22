package handlers

import (
	"database/sql"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/config"
)

type googleAuthRequest struct {
	IDtoken string `json:"id_token"`
}

func GoogleAuthHandler(cfg *config.Config, database *sql.DB) http.HandlerFunc {

}
