package handlers

import (
	"encoding/json"
	"net/http"
)

func TutorHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"Message": "Tutor endpoint - new features on the way",
	})
}
