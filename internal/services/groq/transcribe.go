package groq

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
)

const transcribeURL = "https://api.groq.com/openai/v1/audio/transcriptions"

type TranscribeResponse struct {
	Text string `json:text`
}

func transcribe(apiKey string, audioData []byte, filename string) (string, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", filename)
	//equivalent to <input type='field" placeholder="filename"//
	if err != nil {
		return "", fmt.Errorf("Failed to create form file:%w", err)
	}

	part.Write(audioData)
	writer.WriteField("model", "whisper-large-v3")
	writer.Close()

	//part 2 : this , hmm , ig this will be for creating http request objects ? //
	req, err := http.NewRequest("POST", transcribeURL, &body)
	if err != nil {
		return "", fmt.Errorf("Failed to create Request : %w", err)
	}

	//part 3 :configuring the Req Headers //

	//this block will add groq api key to my req //
	req.Header.Set(
		"Authorization",
		"Bearer"+apiKey,
	)

	//tells groq what kinda data is inside req body //
	req.Header.Set(
		"Content-Type", writer.FormDataContentType(),
	)

	//part4 : sending the req, now to the groq and receiviong the response //
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Groq request sending failure:%w", err)
	}
	defer resp.Body.Close()

	//reads the raw json groq sent as a response ( resp.Body)//
	respBody, _ := io.ReadAll(resp.Body)

	//part5: deserializing from JSON -> GO STRUCT EAZY //
	var result TranscribeResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to parse groq response: %w", err)
	}

	if result.Text == "" {
		return "", fmt.Errorf("groq returned empty transcript — raw response: %s", string(respBody))
	}

	return result.Text, nil
}
