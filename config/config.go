//config hold all of the env variable that app needs, we load them from .env file in development and set them as real env variables instead //

package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHOST     string //HOST IP ADDRESS //
	DBPORT     string //ON WHICH PORT ARE WE HOSTING IT//
	DBUSER     string //NAME OF DATABSE USER//
	DBPASSWORD string //PASSWORD OF DB//
	DBNAME     string //NAME OF DB//

	//GROQ WILL COVER BOTH WHISPER STT AND LLM //
	GROQAPIKEY string
	PORT       string
	CHATURL    string

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	FrontendURL        string
	TrustProxyHeaders  bool
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading OS environment variables")
	}

	cfg := &Config{
		DBHOST:             os.Getenv("DB_HOST"),
		DBPORT:             os.Getenv("DB_PORT"),
		DBUSER:             os.Getenv("DB_USER"),
		DBPASSWORD:         os.Getenv("DB_PASSWORD"),
		DBNAME:             os.Getenv("DB_NAME"),
		GROQAPIKEY:         os.Getenv("GROQ_API_KEY"),
		PORT:               os.Getenv("PORT"),
		CHATURL:            os.Getenv("ChatURL"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		FrontendURL:        os.Getenv("FRONTEND_URL"),
	}
	if len(cfg.GROQAPIKEY) >= 10 {
		log.Printf("DEBUG key starts with: %s", cfg.GROQAPIKEY[:10])
	}
	if cfg.GROQAPIKEY == "" {
		log.Println("WARNING:AI API KEY HAS NOT BEEN SET:")
	}
	if cfg.DBHOST == "" {
		log.Println("WARNING :HOST HAS NOT BEEN SET")
	}
	return cfg
}
