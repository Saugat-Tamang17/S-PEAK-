package handlers

import (
	"database/sql"
	"encoding/json"
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

		//guard :never return nil - this will always return array //
		if rows == nil {
			rows = []db.SessionRow{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(rows)
	}
}
