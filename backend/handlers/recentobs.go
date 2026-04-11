package handlers

import (
	"fmt"
	"net/http"
	"time"

	"bird-dash/cache"
	"bird-dash/ebird"
)

type RecentObsHandler struct {
	client *ebird.Client
	cache  *cache.Cache
}

func NewRecentObs(client *ebird.Client, cache *cache.Cache) *RecentObsHandler {
	return &RecentObsHandler{client: client, cache: cache}
}

func (h *RecentObsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
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
	back := parseInt(r, "back", 7, 1, 30)

	key := fmt.Sprintf("recentobs:%.1f:%.1f:%d:%d", lat, lng, dist, back)

	if data, ok := h.cache.Get(key); ok {
		writeJSON(w, data)
		return
	}

	data, err := h.client.RecentObs(r.Context(), lat, lng, dist, back)
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}

	h.cache.Set(key, data, 2*time.Hour)
	writeJSON(w, data)
}
