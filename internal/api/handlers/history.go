package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/internal/api/middleware"
	"github.com/Saugat-Tamang17/S-PEAK/internal/db"
)

func HistoryHandler(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(middleware.UserIDKey).(int)
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		rows, err := db.GetSessionHistory(database, userID)
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
