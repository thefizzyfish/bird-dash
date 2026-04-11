package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"

	"bird-dash/cache"
	"bird-dash/ebird"
	"bird-dash/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

//go:embed static
var staticFiles embed.FS

func main() {
	apiKey := os.Getenv("EBIRD_API_KEY")
	if apiKey == "" {
		log.Fatal("EBIRD_API_KEY environment variable is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	c := cache.New()
	eb := ebird.New(apiKey)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/api/notable", handlers.NewNotable(eb, c).ServeHTTP)
	r.Get("/api/hotspots", handlers.NewHotspots(eb, c).ServeHTTP)
	r.Get("/api/species", handlers.NewSpecies(eb, c).ServeHTTP)
	r.Get("/api/photo", handlers.NewPhoto(c).ServeHTTP)
	r.Get("/api/taxonomy", handlers.NewTaxonomy(eb, c).ServeHTTP)
	r.Get("/api/recent", handlers.NewRecentObs(eb, c).ServeHTTP)
	r.Get("/api/recent/species", handlers.NewRecentBySpecies(eb, c).ServeHTTP)

	// Serve the React SPA for all non-API routes
	static, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatal(err)
	}
	r.Handle("/*", spaHandler(static))

	log.Printf("listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

// spaHandler serves static files and falls back to index.html for client-side routing.
func spaHandler(fsys fs.FS) http.Handler {
	fileServer := http.FileServer(http.FS(fsys))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimLeft(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		if _, err := fs.Stat(fsys, path); err != nil {
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	})
}
