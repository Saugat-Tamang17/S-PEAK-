package main

import (
	"fmt"

	"github.com/Saugat-Tamang17/S-PEAK/config"
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
}
