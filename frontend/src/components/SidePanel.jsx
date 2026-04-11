import { useBirdPhoto } from '../hooks/useBirdPhoto.js'

const styles = {
  panel: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: 320,
    background: 'rgba(15,23,42,0.93)', color: '#f1f5f9',
    overflowY: 'auto', padding: 16, zIndex: 10,
    borderLeft: '1px solid #1e293b',
  },
  backBtn: {
    background: 'none', border: 'none', color: '#34d399',
    fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12,
  },
  heading: { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#64748b', marginBottom: 10 },
  item: { marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #1e293b' },
  name: { fontWeight: 600, fontSize: 14, color: '#f1f5f9' },
  sci: { fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 1 },
  meta: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  link: { fontSize: 11, color: '#34d399', textDecoration: 'none' },
  empty: { color: '#475569', fontSize: 13, marginTop: 8 },
  hotspotTitle: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  hotspotMeta: { fontSize: 12, color: '#64748b', marginBottom: 14 },
}

function formatDate(obsDt) {
  if (!obsDt) return ''
  return obsDt.split(' ')[0]
}

function BirdRow({ obs }) {
  const photo = useBirdPhoto(obs.sciName)
  return (
    <div style={{ ...styles.item, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 4, flexShrink: 0,
        background: '#1e293b', overflow: 'hidden',
      }}>
        {photo && (
          <img src={photo} alt={obs.comName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={styles.name}>{obs.comName}</div>
        <div style={styles.sci}>{obs.sciName}</div>
        <div style={styles.meta}>
          {obs.totalSeen} seen · {obs.locationCount} {obs.locationCount === 1 ? 'location' : 'locations'}
        </div>
        <div style={{ ...styles.meta, color: '#64748b' }}>Last: {formatDate(obs.obsDt)}</div>
        {obs.subId && (
          <a href={`https://ebird.org/checklist/${obs.subId}`}
            target="_blank" rel="noreferrer" style={styles.link}>
            Latest checklist →
          </a>
        )}
      </div>
    </div>
  )
}

export default function SidePanel({ aggregatedObs, selectedHotspot, speciesList, onClose }) {

  if (selectedHotspot) {
    return (
      <div style={styles.panel}>
        <button style={styles.backBtn} onClick={onClose}>← All Rare Birds</button>
        <div style={styles.hotspotTitle}>
          <a
            href={`https://ebird.org/hotspot/${selectedHotspot.locId}`}
            target="_blank" rel="noreferrer"
            style={{ color: '#34d399', textDecoration: 'none' }}
          >
            {selectedHotspot.locName}
          </a>
        </div>
        <div style={styles.hotspotMeta}>
          {selectedHotspot.numSpeciesAllTime} species all time
        </div>
        <div style={styles.heading}>RECENT SPECIES</div>
        {speciesList.length === 0
          ? <p style={styles.empty}>No recent sightings</p>
          : speciesList.map((s, i) => (
            <div key={i} style={styles.item}>
              <div style={styles.name}>{s.comName}</div>
              <div style={styles.sci}>{s.sciName}</div>
              <div style={styles.meta}>
                {formatDate(s.obsDt)}{s.howMany ? ` · ${s.howMany} seen` : ''}
              </div>
            </div>
          ))
        }
      </div>
    )
  }

  return (
    <div style={styles.panel}>
      <div style={styles.heading}>RARE BIRDS ({aggregatedObs.length} species)</div>
      {aggregatedObs.length === 0
        ? <p style={styles.empty}>Pan the map to load sightings</p>
        : aggregatedObs.map((obs, i) => <BirdRow key={obs.speciesCode ?? i} obs={obs} />)
      }
    </div>
  )
}
