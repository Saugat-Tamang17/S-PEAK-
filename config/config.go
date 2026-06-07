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
}

func load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No env file found,reading env files directly")
	}
	cfg := &Config{
		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     os.Getenv("DB_PORT"),
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
		GroqAPIKey: os.Getenv("GROQAPIKEY"),
		Port:       os.Getenv("PORT"),
	}
}
