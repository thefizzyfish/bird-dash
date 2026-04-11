package handlers

import (
	"fmt"
	"net/http"
	"regexp"
	"time"

	"bird-dash/cache"
	"bird-dash/ebird"
)

var validSpeciesCode = regexp.MustCompile(`^[a-z0-9]{4,10}$`)

type RecentBySpeciesHandler struct {
	client *ebird.Client
	cache  *cache.Cache
}

func NewRecentBySpecies(client *ebird.Client, cache *cache.Cache) *RecentBySpeciesHandler {
	return &RecentBySpeciesHandler{client: client, cache: cache}
}

func (h *RecentBySpeciesHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	speciesCode := r.URL.Query().Get("speciesCode")
	if !validSpeciesCode.MatchString(speciesCode) {
		http.Error(w, "invalid speciesCode", http.StatusBadRequest)
		return
	}
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

	key := fmt.Sprintf("recentbyspecies:%s:%.1f:%.1f:%d:%d", speciesCode, lat, lng, dist, back)

	if data, ok := h.cache.Get(key); ok {
		writeJSON(w, data)
		return
	}

	data, err := h.client.RecentBySpecies(r.Context(), speciesCode, lat, lng, dist, back)
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}

	h.cache.Set(key, data, 2*time.Hour)
	writeJSON(w, data)
}
