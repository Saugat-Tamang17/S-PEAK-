package groq

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/config"
)

func Enhance(cfg *config.Config, rawTranscript string) (string, error) {
	payload := map[string]interface{}{ // this is used for json-like structure
		"model": "llama-3.3-70b-versatile",
		"messages": []map[string]string{
			{
				"role": "system",
				"content": `You are a speech transcription editor. Clean up the following transcript by:
- Removing filler words (um, uh, like, you know)
- Fixing obvious grammar errors
- Breaking run-on sentences
- Preserving the speaker's original meaning and vocabulary. Return only the cleaned transcribed text. No commentary, no preamble.`,
			},
			{
				"role":    "user",
				"content": rawTranscript,
			},
		},
		"max_tokens":  1024, // approximate around 750 words per session
		"temperature": 0.3,  // low temperature = more conservative edits of transcripts
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("Failed to marshal the payload :%w", err)
	}

	req, err := http.NewRequest("POST", cfg.CHATURL, bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer"+cfg.GROQAPIKEY)
	req.Header.Set("Content-Type", "application/json")

	//sending our marshalled data to the ai now //
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Groq Enhancer request failed:%w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result EvaluateResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to parse enhance response: %w", err)
	}

	if len(result.Choices) == 0 || result.Choices[0].Message.Content == "" {
		return "", fmt.Errorf("groq enhancer returned empty — raw: %s", string(respBody))
	}

	return result.Choices[0].Message.Content, nil
}
