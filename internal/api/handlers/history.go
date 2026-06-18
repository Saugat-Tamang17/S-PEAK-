package handlers

import (
	"database/sql"
	"net/http"
)

func HistoryHandler(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}
