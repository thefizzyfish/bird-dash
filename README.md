# Bird Dash

An interactive birding dashboard built on eBird data. Shows a heatmap of rare/notable sightings, birding hotspots, and lets you search for any species to see where it's been spotted recently.

Live at [bird-dash.com](https://bird-dash.com).

## Features

- **Heatmap** — intensity shows concentration of rare sightings in an area
- **Hotspot markers** — sized by all-time species count; click to see recent species list
- **Rare sighting markers** — red dots mark locations with notable observations; click to see the species list for that location
- **Species search** — autocomplete across the full eBird taxonomy; highlights sightings on the map and narrows the list view
- **Notable / All Recent toggle** — switch between rare-flagged observations and all recent sightings
- **Location search** — geocode any place name and jump to it (Nominatim / OpenStreetMap)
- **Near Me** — geolocates and centers the map on your position
- **Random** — jumps to a random loaded hotspot
- **Days back filter** — 3 / 7 / 14 / 30 day window
- **Persistent viewport** — lat/lng/zoom saved in the URL; shareable links work

## Stack

- **Backend:** Go + chi, proxies eBird API (key stays server-side), in-memory TTL cache, per-IP rate limiting
- **Frontend:** React + Vite, MapLibre GL JS, deck.gl (HeatmapLayer + ScatterplotLayer), OpenFreeMap tiles
- **Photos:** iNaturalist API (no auth required)
- **Deployment:** Docker (Go binary embeds built React app), hosted on Render

## Local development

You'll need a free [eBird API key](https://ebird.org/api/keygen).

**Terminal 1 — backend:**
```bash
cd backend
EBIRD_API_KEY=your_key_here go build -o server . && ./server
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Note: `go run .` may crash on macOS 15 due to a missing LC_UUID load command — use `go build` instead.

## Deployment

The included `Dockerfile` builds the frontend with Vite and embeds the output into the Go binary via `//go:embed static`. A single container serves both the API and the SPA.

Deployed on [Render](https://render.com): New Web Service → Docker runtime → set `EBIRD_API_KEY` environment variable.
