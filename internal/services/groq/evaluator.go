package groq

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/Saugat-Tamang17/S-PEAK/config"
	model "github.com/Saugat-Tamang17/S-PEAK/internal/models"
)

type EvaluateResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func Evaluate(cfg *config.Config, transcript string, topic string) *model.EvaluationResult {
	chatURL := cfg.CHATURL
	if chatURL == "" {
		return "", fmt.Errorf("groq CHATURL configuration is missing or empty")
	}

	systemPrompt := "You are an English speech tutor."
	if topic != "" {
		systemPrompt += " The speaker was asked to talk about: " + topic + "."
	}
	systemPrompt += " Evaluate the transcript for grammar, fluency, and content relevance. Give specific, actionable feedback."

	payload := map[string]interface{}{
		"model": "llama-3.3-70b-versatile",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": transcript},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", chatURL, bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+cfg.GROQAPIKEY)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("groq request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body safely
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read groq response body: %w", err)
	}

	// FIX: Handle Non-200 Status Codes from Groq API
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("groq API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var result EvaluateResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to parse groq response JSON: %w", err)
	}

	if len(result.Choices) == 0 || result.Choices[0].Message.Content == "" {
		return "", fmt.Errorf("groq returned no choices — raw response: %s", string(respBody))
	}

	return result.Choices[0].Message.Content, nil
}
