package db

import (
	"database/sql"
	"fmt"
)

func Connect(host, port, user, password, name string) (*sql.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		user, password, host, port, name,
	)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database:%w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("Failed to establish a connection with db (cant ping db as of now ):%w", err)
	}

}
