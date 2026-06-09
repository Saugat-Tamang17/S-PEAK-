package api

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func NewRouter() *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"} // meaning any websites can make http req to my api as of now ,//
		AllowedMethods: []string{"GET","POST","OPTIONS"},
		AllowedHeaders: :[]string{"Content-Type"},
	}))
}
