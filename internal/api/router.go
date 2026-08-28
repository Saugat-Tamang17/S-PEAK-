package api

import (
	"database/sql"
	"time"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	"github.com/Saugat-Tamang17/S-PEAK/internal/api/handlers"
	appmiddleware "github.com/Saugat-Tamang17/S-PEAK/internal/api/middleware"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// NewRouter configures the HTTP routes for the application.
func NewRouter(cfg *config.Config, database *sql.DB) *chi.Mux {
	r := chi.NewRouter()

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{cfg.FrontendURL},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
		MaxAge:         300,
	}))

	// NEW: no global rate limiter here — /health is now unmetered,
	// and each API group below gets its own appropriately-sized budget.

	r.Get("/health", handlers.HealthHandler)

	// Stricter limiter for auth endpoints (brute-force protection needs a low ceiling)
	authLimiter := appmiddleware.NewRateLimiter(20, time.Minute, cfg.TrustProxyHeaders, true)

	// Looser limiter for authenticated data endpoints a normal session hits repeatedly
	dataLimiter := appmiddleware.NewRateLimiter(200, time.Minute, cfg.TrustProxyHeaders, true)

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Use(authLimiter.Handler) // NEW: scoped, not global
			r.Post("/register", (&handlers.AuthHandler{DB: database}).Register)
			r.Post("/login", (&handlers.AuthHandler{DB: database}).Login)
			r.Post("/google", handlers.GoogleAuthHandler(cfg, database))
		})

		r.Group(func(r chi.Router) {
			r.Use(appmiddleware.JWTAuth)
			r.Use(dataLimiter.Handler) // NEW: scoped, not global
			r.Post("/transcription", handlers.TranscribeHandler(cfg, database))
			r.Post("/tutor", handlers.TutorHandler(cfg, database))
			r.Get("/history", handlers.HistoryHandler(database))
		})
	})

	return r
}
