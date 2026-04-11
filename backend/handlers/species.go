package handlers

import (
	"fmt"
	"net/http"
	"regexp"
	"time"

	"bird-dash/cache"
	"bird-dash/ebird"
)

var validLocID = regexp.MustCompile(`^L\d+$`)

type SpeciesHandler struct {
	client *ebird.Client
	cache  *cache.Cache
}

func NewSpecies(client *ebird.Client, cache *cache.Cache) *SpeciesHandler {
	return &SpeciesHandler{client: client, cache: cache}
}

func (h *SpeciesHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	locId := r.URL.Query().Get("locId")
	if !validLocID.MatchString(locId) {
		http.Error(w, "invalid locId: must match L followed by digits", http.StatusBadRequest)
		return
	}
	back := parseInt(r, "back", 7, 1, 30)

	key := fmt.Sprintf("species:%s:%d", locId, back)

	if data, ok := h.cache.Get(key); ok {
		writeJSON(w, data)
		return
	}

	data, err := h.client.LocationRecent(r.Context(), locId, back)
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}

	h.cache.Set(key, data, 2*time.Hour)
	writeJSON(w, data)
}
