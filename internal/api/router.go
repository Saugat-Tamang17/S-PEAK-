package api

import (
	"database/sql"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	"github.com/Saugat-Tamang17/S-PEAK/internal/api/handlers"

	customMiddleware "github.com/Saugat-Tamang17/S-PEAK/internal/api/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func NewRouter(cfg *config.Config, database *sql.DB) *chi.Mux {
	r := chi.NewRouter()

	// 1. Global Middleware (Uses chi's built-in middleware package)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	}))

	// 2. Public Endpoints
	r.Get("/health", handlers.HealthHandler)

	authHandler := &handlers.AuthHandler{DB: database}
	r.Post("/api/v1/auth/register", authHandler.Register)
	r.Post("/api/v1/auth/login", authHandler.Login)

	// 3. Protected Endpoints
	r.Group(func(sub chi.Router) {

		sub.Use(customMiddleware.JWTAuth)

		sub.Post("/api/v1/tutor", handlers.TutorHandler(cfg, database))
		sub.Post("/api/v1/transcription", handlers.TranscribeHandler(cfg, database))
		sub.Get("/api/v1/history", handlers.HistoryHandler(database))
	})

	return r
}
