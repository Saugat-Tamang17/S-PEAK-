package groq

import (
	"bytes"
	"fmt"
	"mime/multipart"
)

const transcribeURL = "https://api.groq.com/openai/v1/audio/transcriptions"

type TranscribeResponse struct {
	Text string `json:text`
}

func transcribe(apiKey string, audioData []byte, filename string) (string, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", fmt.Errorf("Failed to create form file:%w", err)
	}

	part.Write(audioData)
	writer.WriteField("model", "whisper-large-v3")
	writer.Close()
}
