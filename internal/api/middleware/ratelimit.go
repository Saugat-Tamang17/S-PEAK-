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

func NewRateLimiter(limit int, window time.Duration, trustProxyHeaders bool, enabled bool) *RateLimiter {
	ctx, cancel := context.WithCancel(context.Background())
	rl := &RateLimiter{
		visitors:          make(map[string]*visitor),
		limit:             limit,
		window:            window,
		trustProxyHeaders: trustProxyHeaders,
		enabled:           enabled,
		cancel:            cancel,
	}

	return rl
}

// just in case the background runs then we close it gracefully type shii //
func (rl *RateLimiter) Close() {
	if rl.cancel != nil {
		rl.cancel()
	}
}
