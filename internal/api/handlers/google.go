package handlers

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
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
	defer resp.Body.Close()

	var parsed googleJWKSResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, fmt.Errorf("decoding google jwks: %w", err)
	}

	keys := make(map[string]*rsa.PublicKey, len(parsed.Keys))
	for _, k := range parsed.Keys {
		nBytes, err := base64.RawURLEncoding.DecodeString(k.N)
		if err != nil {
			continue
		}
		eBytes, err := base64.RawURLEncoding.DecodeString(k.E)
		if err != nil {
			continue
		}
		keys[k.Kid] = &rsa.PublicKey{
			N: new(big.Int).SetBytes(nBytes),
			E: int(new(big.Int).SetBytes(eBytes).Int64()),
		}
	}

	jwksCache = keys
	jwksExpiry = time.Now().Add(1 * time.Hour)
	return keys, nil
}
