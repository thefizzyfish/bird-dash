import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import BirdMap from './components/BirdMap.jsx'
import SidePanel from './components/SidePanel.jsx'
import SpeciesSearch from './components/SpeciesSearch.jsx'
import { fetchNotable, fetchHotspots, fetchSpecies, fetchRecentBySpecies, fetchRecentObs } from './api/ebird.js'

const DEFAULT_VIEWPORT = {
  latitude: 40.7128,
  longitude: -74.006,
  zoom: 10
}

function distFromZoom(zoom) {
  if (zoom < 8)  return 50
  if (zoom < 10) return 30
  if (zoom < 12) return 20
  return 10
}

const styles = {
  root: { width: '100vw', height: '100vh', position: 'relative' },
  controls: {
    position: 'absolute', top: 12, left: 12, zIndex: 10,
    display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-start'
  },
  button: {
    background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155',
    borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer'
  },
  select: {
    background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155',
    borderRadius: 6, padding: '6px 8px', fontSize: 13
  },
  loading: { color: '#94a3b8', fontSize: 12, padding: '4px 8px' }
}

export default function App() {
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT)
  const [notableObs, setNotableObs] = useState([])
  const [hotspots, setHotspots] = useState([])
  const [selectedHotspot, setSelectedHotspot] = useState(null)
  const [speciesList, setSpeciesList] = useState([])
  const [daysBack, setDaysBack] = useState(7)
  const [mode, setMode] = useState('rare')  // 'rare' | 'all'
  const [loading, setLoading] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState(null)
  const [speciesSightings, setSpeciesSightings] = useState([])
  const debounceRef = useRef(null)
  const speciesDebounceRef = useRef(null)

  const loadData = useCallback(async (vp, back, currentMode) => {
    const { latitude: lat, longitude: lng, zoom } = vp
    const dist = distFromZoom(zoom)
    setLoading(true)
    try {
      const fetchObs = currentMode === 'all' ? fetchRecentObs : fetchNotable
      const [obs, spots] = await Promise.all([
        fetchObs({ lat, lng, dist, back }),
        fetchHotspots({ lat, lng, dist })
      ])
      setNotableObs(obs)
      setHotspots(spots)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadData(viewport, daysBack, mode), 500)
    return () => clearTimeout(debounceRef.current)
  }, [viewport, daysBack, mode, loadData])

  useEffect(() => {
    if (!selectedHotspot) { setSpeciesList([]); return }
    fetchSpecies({ locId: selectedHotspot.locId, back: daysBack })
      .then(setSpeciesList)
      .catch(console.error)
  }, [selectedHotspot, daysBack])

  // Re-fetch species sightings when viewport moves or selection changes
  useEffect(() => {
    if (!selectedSpecies) { setSpeciesSightings([]); return }
    clearTimeout(speciesDebounceRef.current)
    speciesDebounceRef.current = setTimeout(() => {
      const { latitude: lat, longitude: lng, zoom } = viewport
      const dist = distFromZoom(zoom)
      fetchRecentBySpecies({ speciesCode: selectedSpecies.speciesCode, lat, lng, dist, back: daysBack })
        .then(setSpeciesSightings)
        .catch(console.error)
    }, 500)
    return () => clearTimeout(speciesDebounceRef.current)
  }, [selectedSpecies, viewport, daysBack])

  // One point per location, weight = total individuals seen there
  const heatmapPoints = useMemo(() => {
    const byLoc = {}
    for (const obs of notableObs) {
      const key = obs.locId || `${obs.lat},${obs.lng}`
      if (!byLoc[key]) byLoc[key] = { lat: obs.lat, lng: obs.lng, weight: 0 }
      byLoc[key].weight += obs.howMany || 1
    }
    return Object.values(byLoc)
  }, [notableObs])

  // One entry per species, most recent sighting date, total count + location count
  const aggregatedObs = useMemo(() => {
    const bySpecies = {}
    for (const obs of notableObs) {
      const key = obs.speciesCode || obs.comName
      if (!bySpecies[key]) {
        bySpecies[key] = {
          comName: obs.comName,
          sciName: obs.sciName,
          speciesCode: obs.speciesCode,
          obsDt: obs.obsDt,
          subId: obs.subId,
          totalSeen: 0,
          locationNames: new Set(),
        }
      }
      const entry = bySpecies[key]
      entry.totalSeen += obs.howMany || 1
      entry.locationNames.add(obs.locName)
      if (new Date(obs.obsDt) > new Date(entry.obsDt)) {
        entry.obsDt = obs.obsDt
        entry.subId = obs.subId
      }
    }
    return Object.values(bySpecies)
      .map(s => ({ ...s, locationCount: s.locationNames.size, locationNames: undefined }))
      .sort((a, b) => new Date(b.obsDt) - new Date(a.obsDt))
  }, [notableObs])

  // When a species is selected, collapse speciesSightings into one list entry
  const filteredObs = useMemo(() => {
    if (!selectedSpecies) return aggregatedObs
    if (speciesSightings.length === 0) return []
    let totalSeen = 0
    let obsDt = ''
    let subId = ''
    const locs = new Set()
    for (const obs of speciesSightings) {
      totalSeen += obs.howMany || 1
      locs.add(obs.locName)
      if (!obsDt || obs.obsDt > obsDt) { obsDt = obs.obsDt; subId = obs.subId }
    }
    return [{
      comName: selectedSpecies.comName,
      sciName: selectedSpecies.sciName,
      speciesCode: selectedSpecies.speciesCode,
      obsDt, subId, totalSeen, locationCount: locs.size,
    }]
  }, [selectedSpecies, speciesSightings, aggregatedObs])

  function handleNearMe() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setViewport(v => ({
        ...v, latitude: coords.latitude, longitude: coords.longitude, zoom: 11
      })),
      () => alert('Could not get your location')
    )
  }

  return (
    <div style={styles.root}>
      <BirdMap
        viewport={viewport}
        onViewportChange={setViewport}
        heatmapPoints={heatmapPoints}
        hotspots={hotspots}
        onSelectHotspot={setSelectedHotspot}
        selectedHotspot={selectedHotspot}
        speciesSightings={speciesSightings}
      />

      <div style={styles.controls}>
        <button style={styles.button} onClick={handleNearMe}>Near Me</button>
        <div style={{ display: 'flex', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflow: 'hidden' }}>
          {['rare', 'all'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelectedSpecies(null); setSpeciesSightings([]) }}
              style={{
                ...styles.button,
                border: 'none', borderRadius: 0,
                background: mode === m ? '#334155' : 'transparent',
                color: mode === m ? '#f1f5f9' : '#64748b',
              }}
            >
              {m === 'rare' ? 'Notable' : 'All Recent'}
            </button>
          ))}
        </div>
        <SpeciesSearch
          selectedSpecies={selectedSpecies}
          onSelect={s => { setSelectedSpecies(s); setSelectedHotspot(null) }}
          onClear={() => { setSelectedSpecies(null); setSpeciesSightings([]) }}
        />
        <select
          style={styles.select}
          value={daysBack}
          onChange={e => setDaysBack(Number(e.target.value))}
        >
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
        {loading && <span style={styles.loading}>Loading...</span>}
      </div>

      <SidePanel
        aggregatedObs={filteredObs}
        selectedHotspot={selectedHotspot}
        speciesList={speciesList}
        onClose={() => setSelectedHotspot(null)}
      />
    </div>
  )
}
