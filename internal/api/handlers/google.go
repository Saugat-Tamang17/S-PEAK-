package handlers

import (
	"crypto/rsa"
	"fmt"
	"net/http"
	"sync"
	"time"
)

const googleJWKSURL = "https://www.googleapis.com/oauth2/v3/certs"

type googleJWK struct {
	Kid string `json:"kid"` //keyID pr uniqwue token for the header
	N   string `json:"n"`   //modulus(n)
	E   string `json:"e"`   //exponent(e)
}

type googleJWKSResponse struct {
	Keys []googleJWK `json:"keys"`
}

var (
	jwksMu     sync.Mutex                //for thread safety i.e concurrency baby//
	jwksCache  map[string]*rsa.PublicKey //kind of like storage or cache where the rsa public key arranged by Kid is stored for time //
	jwksExpiry time.Time                 // defines TTL of the keys in that map
)

func fetchGoogleJWKS(forceRefresh bool) (map[string]*rsa.PublicKey, error) {
	jwksMu.Lock()
	defer jwksMu.Unlock()

	if !forceRefresh && jwksCache != nil && time.Now().Before(jwksExpiry) {
		return jwksCache, nil
	}
	resp, err := http.Get(googleJWKSURL)
	if err != nil {
		return nil, fmt.Errorf("fetching google jwks: %w", err)
	}
}
