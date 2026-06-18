package handlers

import (
	"database/sql"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/internal/db"
)

func HistoryHandler(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//hardcoded user =1 ,until auth is wired later on
		rows, err := db.GetSessionHistory(database, 1)
		if err != nil {
			http.Error(w, "failed to fetch history", http.StatusInternalServerError)
			return
		}
	}
}
