package groq

func Enhance(apiKey string, rawTranscript string) (string, error) {
payload :=map[string]interface{}{ //this is used for json like structure //

	"model":"llama-3.3-70b-versatile",
	"messages":[]map[string]string{
		"role":"system",
		"content":`You are a speech transcription editor.Clean up the following transcript by:
- Removing filler words (um, uh, like, you know)
- Fixing obvious grammar errors
- Breaking run-on sentences
- Preserving the speaker's original meaning and vocabulary.Return onlly the cleaned transcripted text.No commentary,no preamble. `,
	},
	{
      "role":    "user",
      "content": rawTranscript,
    },
},
"max_tokens":1024, //approximate around 750 words per session //

"temperature":0.3, // low temperature =more conservative edits of transcripts 
}