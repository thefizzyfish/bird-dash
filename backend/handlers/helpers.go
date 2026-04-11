package handlers

import (
	"fmt"
	"net/http"
	"strconv"
)

func parseFloat(r *http.Request, key string, min, max float64) (float64, error) {
	s := r.URL.Query().Get(key)
	if s == "" {
		return 0, fmt.Errorf("missing required parameter: %s", key)
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil || v < min || v > max {
		return 0, fmt.Errorf("invalid %s: must be between %g and %g", key, min, max)
	}
	return v, nil
}

func parseInt(r *http.Request, key string, defaultVal, min, max int) int {
	s := r.URL.Query().Get(key)
	if s == "" {
		return defaultVal
	}
	v, err := strconv.Atoi(s)
	if err != nil || v < min || v > max {
		return defaultVal
	}
	return v
}

func writeJSON(w http.ResponseWriter, data []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}
