package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/internal/services/groq"
)

func TranscribeHandler(apiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err := r.ParseMultipartForm(10 << 20)
		if err != nil {
			log.Printf("ParseMultipartForm error: %v", err)
			http.Error(w, "failed to parse form", http.StatusBadRequest)
			return
		}

		file, header, err := r.FormFile("audio")
		if err != nil {
			log.Printf("FormFile error: %v", err)
			http.Error(w, "audio file required", http.StatusBadRequest)
			return
		}
		defer file.Close()

		audioBytes, _ := io.ReadAll(file)

		transcript, err := groq.Transcribe(apiKey, audioBytes, header.Filename)
		if err != nil {
			log.Printf("Transcription error: %v", err)
			http.Error(w, "transcription failed", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"transcript": transcript,
		})
	}
}
