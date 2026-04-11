# Bird Dash

An interactive birding dashboard built on eBird data. Shows a heatmap of rare/notable sightings, birding hotspots, and lets you search for any species to see where it's been spotted recently.

## Features

- **Heatmap** — intensity shows concentration of rare sightings in an area
- **Hotspot markers** — sized by all-time species count; click to see recent species list
- **Species search** — autocomplete across the full eBird taxonomy; highlights sightings on the map
- **Notable / All Recent toggle** — switch between rare-flagged observations and all recent sightings
- **Near Me** — geolocates and centers the map on your position
- **Days back filter** — 3 / 7 / 14 / 30 day window

## Stack

- **Backend:** Go + chi, proxies eBird API (key stays server-side), in-memory cache
- **Frontend:** React + Vite, MapLibre GL JS, deck.gl, OpenFreeMap tiles
- **Photos:** iNaturalist API

## Local development

You'll need a free [eBird API key](https://ebird.org/api/keygen).

**Terminal 1 — backend:**
```bash
cd backend
EBIRD_API_KEY=your_key_here go run .
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deployment

The included `Dockerfile` builds the frontend and embeds it into the Go binary as a single container.

Deployed on [Render](https://render.com): New Web Service → Docker runtime → set `EBIRD_API_KEY` environment variable.
