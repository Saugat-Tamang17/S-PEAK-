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
package api

import (
	"database/sql"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	"github.com/Saugat-Tamang17/S-PEAK/internal/api/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
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
	
	authHandler:=&handler.AuthHandler{DB:database}


r.Group(func(r chi.Router){
	r.Use(handlers.JWTAuth) 

		
		r.Post("/api/v1/tutor", handlers.TutorHandler(cfg, database))
		r.Post("/api/v1/transcription", handlers.TranscribeHandler(cfg, database))
		r.Get("/api/v1/history", handlers.HistoryHandler(database))
})

return r
}
