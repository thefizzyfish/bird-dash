export async function fetchNotable({ lat, lng, dist, back }) {
  const params = new URLSearchParams({ lat, lng, dist, back })
  const res = await fetch(`/api/notable?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch notable observations: ${res.status}`)
  return res.json()
}

export async function fetchHotspots({ lat, lng, dist }) {
  const params = new URLSearchParams({ lat, lng, dist })
  const res = await fetch(`/api/hotspots?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch hotspots: ${res.status}`)
  return res.json()
}

export async function fetchSpecies({ locId, back }) {
  const params = new URLSearchParams({ locId, back })
  const res = await fetch(`/api/species?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch species: ${res.status}`)
  return res.json()
}

export async function fetchTaxonomy() {
  const res = await fetch('/api/taxonomy')
  if (!res.ok) throw new Error(`Failed to fetch taxonomy: ${res.status}`)
  return res.json()
}

export async function fetchRecentBySpecies({ speciesCode, lat, lng, dist, back }) {
  const params = new URLSearchParams({ speciesCode, lat, lng, dist, back })
  const res = await fetch(`/api/recent/species?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch species sightings: ${res.status}`)
  return res.json()
}

export async function fetchRecentObs({ lat, lng, dist, back }) {
  const params = new URLSearchParams({ lat, lng, dist, back })
  const res = await fetch(`/api/recent?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch recent observations: ${res.status}`)
  return res.json()
}
