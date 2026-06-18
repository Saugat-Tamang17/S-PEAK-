package api

import (
	"database/sql"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	"github.com/Saugat-Tamang17/S-PEAK/internal/api/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func NewRouter(cfg *config.Config, database *sql.DB) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"}, // meaning any websites can make http req to my api as of now ,//
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type"},
	}))

	r.Get("/health", handlers.HealthHandler)

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/transcription", handlers.TranscribeHandler(cfg, database))
		r.Post("/tutor", handlers.TutorHandler(cfg, database))
		r.Get("/history", handlers.HistoryHandler(database)) // ← new
	})

	return r
}
