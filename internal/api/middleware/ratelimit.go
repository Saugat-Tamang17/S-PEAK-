package middleware

import (
	"time"
)

type visitor struct {
	count     int
	windowEnd time.Time
}
