package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"bird-dash/cache"
)

type PhotoHandler struct {
	cache      *cache.Cache
	httpClient *http.Client
}

func NewPhoto(cache *cache.Cache) *PhotoHandler {
	return &PhotoHandler{
		cache:      cache,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

type photoResponse struct {
	URL string `json:"url"`
}

func (h *PhotoHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	sciName := r.URL.Query().Get("sciName")
	if sciName == "" {
		http.Error(w, "missing sciName", http.StatusBadRequest)
		return
	}

	key := "photo:" + sciName
	if data, ok := h.cache.Get(key); ok {
		writeJSON(w, data)
		return
	}

	photoURL, err := h.fetchFromINaturalist(r.Context(), sciName)
	if err != nil {
		// Return empty rather than an error — missing photo is not fatal
		writeJSON(w, []byte(`{"url":""}`))
		return
	}

	data, _ := json.Marshal(photoResponse{URL: photoURL})
	// Photos don't change — cache for 7 days
	h.cache.Set(key, data, 7*24*time.Hour)
	writeJSON(w, data)
}

func (h *PhotoHandler) fetchFromINaturalist(ctx context.Context, sciName string) (string, error) {
	apiURL := fmt.Sprintf(
		"https://api.inaturalist.org/v1/taxa?q=%s&rank=species&per_page=1",
		url.QueryEscape(sciName),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "bird-dash/1.0")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result struct {
		Results []struct {
			DefaultPhoto *struct {
				SquareURL string `json:"square_url"`
			} `json:"default_photo"`
		} `json:"results"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}
	if len(result.Results) == 0 || result.Results[0].DefaultPhoto == nil {
		return "", fmt.Errorf("no photo found")
	}

	return result.Results[0].DefaultPhoto.SquareURL, nil
}
