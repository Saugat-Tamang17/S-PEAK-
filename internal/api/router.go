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

// NewRateLimiter creates a new rate limiter and starts
// its background cleanup goroutine.
func NewRateLimiter(
	limit int,
	window time.Duration,
	trustProxyHeaders bool,
	enabled bool,
) *RateLimiter {

	ctx, cancel := context.WithCancel(context.Background())

	rl := &RateLimiter{
		visitors:          make(map[string]*visitor),
		limit:             limit,
		window:            window,
		trustProxyHeaders: trustProxyHeaders,
		enabled:           enabled,
		cancel:            cancel,
	}

	// Start background cleanup.
	go rl.cleanup(ctx)

	return rl
}

// RateLimit is a convenience function that creates a
// rate limiter and returns its HTTP middleware handler.
func RateLimit(
	limit int,
	window time.Duration,
	trustProxyHeaders bool,
) func(http.Handler) http.Handler {

	rl := NewRateLimiter(
		limit,
		window,
		trustProxyHeaders,
		true,
	)

	return rl.Handler
}

// Close stops the background cleanup goroutine.
func (rl *RateLimiter) Close() {
	if rl.cancel != nil {
		rl.cancel()
	}
}

// cleanup periodically removes expired visitors.
func (rl *RateLimiter) cleanup(ctx context.Context) {

	// The ticker produces a tick every rl.window.
	ticker := time.NewTicker(rl.window)
	defer ticker.Stop()

	for {
		select {

		// Stop cleanup when the context is cancelled.
		case <-ctx.Done():
			return

		// Perform cleanup every time the ticker fires.
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

// Handler is the actual HTTP middleware.
func (rl *RateLimiter) Handler(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// If rate limiting is disabled,
		// allow the request immediately.
		if !rl.enabled {
			next.ServeHTTP(w, r)
			return
		}

		// Determine the client's IP address.
		ip := rl.getClientIP(r)

		rl.mu.Lock()

		v, exists := rl.visitors[ip]
		now := time.Now()

		// No existing visitor OR previous window expired.
		if !exists || now.After(v.windowEnd) {

			rl.visitors[ip] = &visitor{
				count:     1,
				windowEnd: now.Add(rl.window),
			}

			rl.mu.Unlock()

			// Allow the request.
			next.ServeHTTP(w, r)
			return
		}

		// Request limit has been reached.
		if v.count >= rl.limit {

			rl.mu.Unlock()

			w.Header().Set(
				"Retry-After",
				rl.window.String(),
			)

			http.Error(
				w,
				"too many requests, please try again later",
				http.StatusTooManyRequests,
			)

			return
		}

		// Request is allowed, increment request count.
		v.count++

		rl.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}

// getClientIP determines the IP address of the requester.
func (rl *RateLimiter) getClientIP(r *http.Request) string {

	// Only trust proxy headers when explicitly enabled.
	if rl.trustProxyHeaders {

		// X-Forwarded-For may contain multiple IP addresses.
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			return strings.TrimSpace(
				strings.Split(xff, ",")[0],
			)
		}

		// Check X-Real-IP if X-Forwarded-For is unavailable.
		if xri := r.Header.Get("X-Real-IP"); xri != "" {
			return strings.TrimSpace(xri)
		}
	}

	// Fall back to the direct connection address.
	ip, _, err := net.SplitHostPort(r.RemoteAddr)

	if err != nil {
		return r.RemoteAddr
	}

	return ip
}
