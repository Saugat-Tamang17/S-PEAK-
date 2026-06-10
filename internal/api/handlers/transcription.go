package handlers

import (
	"net/http"
)

func TranscribeHandler(apiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r.ParseMultipartForm(10 << 20) //meaning 10 MB max for audio form//

	}
}
