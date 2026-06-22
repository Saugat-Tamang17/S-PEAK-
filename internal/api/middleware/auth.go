package middleware

//not using stringdirectly to avoid context key collision //
type contextKey string

const UserIDKey contextKey = "user_id"
