package middleware

import (
	"context"
	"net"
	"net/http"
	"strings"
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

func (rl *RateLimiter) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Bypass rate limiting if disabled (useful for dev mode or local testing)
		if !rl.enabled {
			next.ServeHTTP(w, r)
			return
		}

		ip := rl.getClientIP(r)

		rl.mu.Lock()
		v, exists := rl.visitors[ip]
		now := time.Now()

		if !exists || now.After(v.windowEnd) {
			rl.visitors[ip] = &visitor{count: 1, windowEnd: now.Add(rl.window)}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		if v.count >= rl.limit {
			rl.mu.Unlock()
			w.Header().Set("Retry-After", rl.window.String())
			http.Error(w, "too many requests, please try again later", http.StatusTooManyRequests)
			return
		}

		v.count++
		rl.mu.Unlock()
		next.ServeHTTP(w, r)
	})
}

func (rl *RateLimiter) getClientIP(r *http.Request) string {
	if rl.trustProxyHeaders {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			return strings.TrimSpace(strings.Split(xff, ",")[0])
		}
		if xri := r.Header.Get("X-Real-IP"); xri != "" {
			return xri
		}
	}

	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}
