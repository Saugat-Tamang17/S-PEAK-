package handlers

import (
	"encoding/json"
	"net/http"
)

func TranscriptionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "Application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"Message": "Transcription endpoint - new features on the way",
	})
}
