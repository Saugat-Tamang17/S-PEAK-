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

func Evaluate(cfg *config.Config, transcript string, topic string) (*model.EvaluationResult, err) {
	ChatURL := cfg.CHATURL
	systemPrompt := `You are an English speech tutor. Evaluate the transcript and respond ONLY with a JSON object — no markdown, no preamble, no explanation outside the JSON.

Return exactly this structure:
{
  "grammar_score":  <integer 0-10>,
  "fluency_score":  <integer 0-10>,
  "content_score":  <integer 0-10>,
  "overall_score":  <integer 0-10>,
  "feedback":       "<2-3 sentences of actionable feedback>",
  "corrected_text": "<the transcript rewritten with errors fixed>"
}
Do not include any text before or after the JSON object.`

	if topic != "" {
		systemPrompt += "\n\nThe speaker was asked to talk about " + topic + ". Factor relevance into content score."
	}

	//changes up to this point //
	payload := map[string]interface{}{
		"model": "llama-3.3-70b-versatile",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": transcript},
		},
		"max_tokens":  1024,
		"temperature": 0.2,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", ChatURL, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+cfg.GROQAPIKEY)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("groq request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body safely
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read groq response body: %w", err)
	}

	// FIX: Handle Non-200 Status Codes from Groq API
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("groq API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var groqresq EvaluateResponse
	if err := json.Unmarshal(respBody, &groqresq); err != nil {
		return nil, fmt.Errorf("failed to parse groq response JSON: %w", err)
	}

	if len(groqresq.Choices) == 0 || groqresq.Choices[0].Message.Content == "" {
		return nil, fmt.Errorf("groq returned no choices — raw response: %s", string(respBody))
	}
	rawJSON := groqresq.Choices[0].Message.Content
	var result model.EvaluationResult
	if err := json.Unmarshal([]byte(rawJSON), &result); err != nil {
		return nil, fmt.Errorf("parse evaluation JSON: %w — raw content: %s", err, rawJSON)
	}
	return &result, nil
}
