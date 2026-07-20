package middleware

import (
	"net"
	"net/http"
	"strings"
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
		if xff := r.Header.Get("X-Forwareded-For"); xff != "" {
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
