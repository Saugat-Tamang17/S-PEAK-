package middleware

import (
	"context"
	"sync"
	"time"
)

type visitor struct {
	count     int
	windowEnd time.Time
}

type RateLimiter struct {
	mu                sync.RWMutex
	visitors          map[string]*visitor
	limit             int
	window            time.Duration
	trustProxyHeaders bool
	enabled           bool
	cancel            context.CancelFunc
}
