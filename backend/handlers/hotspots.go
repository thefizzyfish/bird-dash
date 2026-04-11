package handlers

import (
	"fmt"
	"net/http"
	"time"

	"bird-dash/cache"
	"bird-dash/ebird"
)

type HotspotsHandler struct {
	client *ebird.Client
	cache  *cache.Cache
}

func NewHotspots(client *ebird.Client, cache *cache.Cache) *HotspotsHandler {
	return &HotspotsHandler{client: client, cache: cache}
}

func (h *HotspotsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	lat, err := parseFloat(r, "lat", -90, 90)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	lng, err := parseFloat(r, "lng", -180, 180)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	dist := parseInt(r, "dist", 25, 1, 50)

	key := fmt.Sprintf("hotspots:%.1f:%.1f:%d", lat, lng, dist)

	if data, ok := h.cache.Get(key); ok {
		writeJSON(w, data)
		return
	}

	data, err := h.client.Hotspots(r.Context(), lat, lng, dist)
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}

	// Hotspot locations change rarely — cache for 24 hours
	h.cache.Set(key, data, 24*time.Hour)
	writeJSON(w, data)
}
