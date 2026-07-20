package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type visitor struct {
	count     int       //how many request the ip has made so far
	windowEnd time.Time // meaning how much req were made , during that time window ( for eg: 60 req in 1 min)//
}

// getClientIP identifies and tracks that specific IP address or device that made the request//

// meanwhile trustProxyHeaders is a safety switch to trust the proxy headers//
func getClientIP(r *http.Request, trustProxyHeaders bool) string {
	if trustProxyHeaders {
		//given that the req travels through multiple proxies like cloudfare,vercel etc we will store them all in array string and take 0 indexed string which is the ip//
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			return strings.TrimSpace(strings.Split(xff, ",")[0])
		}
		if xri := r.Header.Get("X-Real-IP"); xri != "" {
			return xri
		}
	}

	//net.SplitHostPort will add the ip address in the r.remoteAddr ,also combines ip address and port using colon //

	//ip will store the ip address , _ means that we dont care about port number combined in that r.RemoteAddr //
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

// func signature for the rate limiter and middleware wrapper //
func RateLimit(limit int, window time.Duration, trustProxyHeaders bool) func(http.Handler) http.Handler {
	var mu sync.Mutex
	visitors := make(map[string]*visitor)

	//goroutine for periodic cleanup so that map doesnt grow forever from one off visitor//
	go func() {
		for {
			time.Sleep(window)
			mu.Lock()
			now := time.Now()
			for ip, v := range visitors {
				if now.After(v.windowEnd) {
					delete(visitors, ip)
				}
			}
			mu.Unlock()
		}
	}()
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := getClientIP(r, trustProxyHeaders)

			mu.Lock()
			v, exists := visitors[ip]
			now := time.Now()

			if !exists || now.After(v.windowEnd) {
				visitors[ip] = &visitor{count: 1, windowEnd: now.Add(window)}
				mu.Unlock()
				next.ServeHTTP(w, r)
				return
			}
			if v.count >= limit {
				mu.Unlock()
				http.Error(w, "too many requests, please try again later", http.StatusTooManyRequests)
				return
			}
			v.count++
			mu.Unlock()
			next.ServeHTTP(w, r)
		})
	}
}
