package model

type EvaluationResult struct {
	GrammarScore     int    `json:"grammar_score"`
	FLuencyScore     int    `json:"fluency_score"`
	ContentScore     int    `json:"content_score"`
	OverallScore     int    `json:"overall_score"`
	Feedback         string `json:"feedback"`
	Corrected_answer string `json:"corrected_answer"`
}
