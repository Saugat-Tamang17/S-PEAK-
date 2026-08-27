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
	go rl.cleanup(ctx)
	return rl
}

// just in case the background runs then we close it gracefully type shii //
func (rl *RateLimiter) Close() {
	if rl.cancel != nil {
		rl.cancel()
	}
}

func (rl *RateLimiter) cleanup(ctx context.Context) {
	//ticker will be responsible for sending the current time ,same value as  the window of ratelimiter //
	ticker := time.NewTicker(rl.window)
	defer ticker.Stop()

	//the cleanup process will be done in he interval manner i.e clean -- stop -- clean -- stop according to the ticker //
	for {
		select {
		//ctx.done() kinda signal whose value "bool" will be goingin the channel ""
		case <-ctx.Done():
			return
			//ticker.C here is a channel which sends the value periodically
		case <-ticker.C:
			rl.mu.Lock()
			now := time.Now()
			for ip, v := range rl.visitors {
				if now.After(v.windowEnd) {
					delete(rl.visitors, ip)
				}
			}
			rl.mu.Unlock()
		}
	}
}
