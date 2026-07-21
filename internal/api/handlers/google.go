package handlers
import {

}

const googleJWKSURL = "https://www.googleapis.com/oauth2/v3/certs"

type googleJWK struct {
	Kid string `json:"kid"` //keyID pr uniqwue token for the header
	N   string `json:"n"` //modulus(n)
	E   string `json:"e"` //exponent(e)
}

type googleJWKSResponse struct {
	Keys []googleJWK `json:"keys"`
}