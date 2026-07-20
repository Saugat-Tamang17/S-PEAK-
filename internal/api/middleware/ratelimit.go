package middleware

import (
	"net/http"
	"time"
)

type visitor struct {
	count     int       //how many request the ip has made so far
	windowEnd time.Time // meaning how much req were made , during that time window ( for eg: 60 req in 1 min)//
}

func getClientIP(r *http.Request, trustProxyHeaders bool) string {

}
