package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	"github.com/Saugat-Tamang17/S-PEAK/internal/api"
	"github.com/Saugat-Tamang17/S-PEAK/internal/db"
)

func main() {
	cfg := config.Load()

	//day1:CHECKING IF the config loaded correctly just for now
	fmt.Println("Config loaded sucessfully.")
	fmt.Printf("DB Host : %s\n", cfg.DBHOST)
	fmt.Printf("DB Port : %s\n", cfg.DBPORT)
	fmt.Printf("DB Name : %s\n", cfg.DBNAME)
	fmt.Printf("PORT : %s\n", cfg.PORT)

	if cfg.GROQAPIKEY != "" {
		fmt.Println("GROQ API KEY is also loaded and : SET")
	} else {
		fmt.Println("   Groq API Key: NOT SET ")
	}

	database, err := db.Connect(
		cfg.DBHOST,
		cfg.DBPORT,
		cfg.DBUSER,
		cfg.DBPASSWORD,
		cfg.DBNAME,
	)

	if err != nil {
		log.Fatalf("databased connection has failed :%v", err)

	}
	defer database.Close()

	router := api.NewRouter(cfg, database)
	log.Printf("Server starting on port: %s", cfg.PORT)

	if err := http.ListenAndServe(":"+cfg.PORT, router); err != nil {
		log.Fatalf("Server failed: %v", err)
	}

	log.Println("Day 2 complete. Nothing is running yet — that comes later.")
}
