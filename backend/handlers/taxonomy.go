package handlers

import (
	"net/http"
	"time"

	"bird-dash/cache"
	"bird-dash/ebird"
)

type TaxonomyHandler struct {
	client *ebird.Client
	cache  *cache.Cache
}

func NewTaxonomy(client *ebird.Client, cache *cache.Cache) *TaxonomyHandler {
	return &TaxonomyHandler{client: client, cache: cache}
}

func (h *TaxonomyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	const key = "taxonomy"

	if data, ok := h.cache.Get(key); ok {
		writeJSON(w, data)
		return
	}

	data, err := h.client.Taxonomy(r.Context())
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}

	h.cache.Set(key, data, 24*time.Hour)
	writeJSON(w, data)
}
