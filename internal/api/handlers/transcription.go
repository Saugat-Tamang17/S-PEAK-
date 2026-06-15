package handlers

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	groq "github.com/Saugat-Tamang17/S-PEAK/internal/services/groq"
)

func TranscribeHandler(cfg *config.Config, database *sql.DB) http.HandlerFunc {
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

		rawtranscript, err := groq.Transcribe(cfg.GROQAPIKEY, audioBytes, header.Filename)
		if err != nil {
			log.Printf("Transcription error: %v", err)
			http.Error(w, "transcription failed", http.StatusInternalServerError)
			return
		}

		enhanced, err := groq.Enhance(cfg, rawtranscript)
		if err != nil {
			log.Printf("Enhance error: %v — falling back to raw", err)
			enhanced = rawtranscript // degrade gracefully, don't fail the whole request
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"transcript": rawtranscript,
		})
	}
}
