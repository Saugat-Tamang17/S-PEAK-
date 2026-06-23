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

	authHandler := &handlers.AuthHandler{DB: db}
	r.Post("/api/v1/auth/register", authHandler.Register)
	r.Post("/api/v1/auth/login", authHandler.Login)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"}, // meaning any websites can make http req to my api as of now ,//
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type"},
	}))

	r.Get("/health", handlers.HealthHandler)
	r.Group(func(r chi.Router) {
		r.Use(middleware.JWTAuth)

		r.Post("/api/v1/tutor", handlers.TutorHandler(cfg, db))
		r.Post("/api/v1/transcription", handlers.TranscribeHandler(cfg, db))
		r.Get("/api/v1/history", handlers.HistoryHandler(db))
	})

	return r
}
