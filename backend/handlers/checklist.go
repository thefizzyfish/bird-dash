package handlers

import (
	"net/http"
	"regexp"
	"time"

	"bird-dash/cache"
	"bird-dash/ebird"
)

var validSubID = regexp.MustCompile(`^S\d+$`)

type ChecklistHandler struct {
	client *ebird.Client
	cache  *cache.Cache
}

func NewChecklist(client *ebird.Client, cache *cache.Cache) *ChecklistHandler {
	return &ChecklistHandler{client: client, cache: cache}
}

func (h *ChecklistHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	subId := r.URL.Query().Get("subId")
	if !validSubID.MatchString(subId) {
		http.Error(w, "invalid subId: must match S followed by digits", http.StatusBadRequest)
		return
	}

	key := "checklist:" + subId

	if data, ok := h.cache.Get(key); ok {
		writeJSON(w, data)
		return
	}

	data, err := h.client.Checklist(r.Context(), subId)
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}

	// Checklists are immutable once submitted — cache for 24 hours
	h.cache.Set(key, data, 24*time.Hour)
	writeJSON(w, data)
}
