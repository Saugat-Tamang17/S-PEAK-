package groq

const transcribeURL = "https://api.groq.com/openai/v1/audio/transcriptions"

type TranscribeResponse struct {
	Text string `json:text`
}
