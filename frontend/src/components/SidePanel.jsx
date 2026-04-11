import { useBirdPhoto } from '../hooks/useBirdPhoto.js'
import { useIsMobile } from '../hooks/useIsMobile.js'

const s = {
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
    <div style={{ ...s.item, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 48, height: 48, borderRadius: 4, flexShrink: 0, background: '#1e293b', overflow: 'hidden' }}>
        {photo && <img src={photo} alt={obs.comName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={s.name}>{obs.comName}</div>
        <div style={s.sci}>{obs.sciName}</div>
        <div style={s.meta}>{obs.totalSeen} seen · {obs.locationCount} {obs.locationCount === 1 ? 'location' : 'locations'}</div>
        <div style={{ ...s.meta, color: '#64748b' }}>Last: {formatDate(obs.obsDt)}</div>
        {obs.subId && (
          <a href={`https://ebird.org/checklist/${obs.subId}`} target="_blank" rel="noreferrer" style={s.link}>
            Latest checklist →
          </a>
        )}
      </div>
    </div>
  )
}

function PanelContent({ aggregatedObs, selectedHotspot, speciesList, onClose }) {
  if (selectedHotspot) {
    return (
      <>
        <button style={s.backBtn} onClick={onClose}>← All Birds</button>
        <div style={s.hotspotTitle}>
          <a href={`https://ebird.org/hotspot/${selectedHotspot.locId}`}
            target="_blank" rel="noreferrer" style={{ color: '#34d399', textDecoration: 'none' }}>
            {selectedHotspot.locName}
          </a>
        </div>
        <div style={s.hotspotMeta}>{selectedHotspot.numSpeciesAllTime} species all time</div>
        <div style={s.heading}>RECENT SPECIES</div>
        {speciesList.length === 0
          ? <p style={s.empty}>No recent sightings</p>
          : speciesList.map((sp, i) => (
            <div key={i} style={s.item}>
              <div style={s.name}>{sp.comName}</div>
              <div style={s.sci}>{sp.sciName}</div>
              <div style={s.meta}>{formatDate(sp.obsDt)}{sp.howMany ? ` · ${sp.howMany} seen` : ''}</div>
            </div>
          ))
        }
      </>
    )
  }
  return (
    <>
      <div style={s.heading}>BIRDS ({aggregatedObs.length})</div>
      {aggregatedObs.length === 0
        ? <p style={s.empty}>Pan the map to load sightings</p>
        : aggregatedObs.map((obs, i) => <BirdRow key={obs.speciesCode ?? i} obs={obs} />)
      }
    </>
  )
}

export default function SidePanel({ aggregatedObs, selectedHotspot, speciesList, onClose, isOpen, onToggle }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Persistent handle — always visible, always tappable */}
        <div
          onClick={onToggle}
          style={{
            background: 'rgba(15,23,42,0.97)',
            borderTop: '1px solid #334155',
            borderRadius: '12px 12px 0 0',
            padding: '10px 16px 8px',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}
        >
          <div style={{ width: 36, height: 4, background: '#475569', borderRadius: 2 }} />
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            {selectedHotspot
              ? selectedHotspot.locName
              : `${aggregatedObs.length} bird${aggregatedObs.length !== 1 ? 's' : ''} ${isOpen ? '▼' : '▲'}`
            }
          </div>
        </div>

        {/* Collapsible content */}
        <div style={{
          height: isOpen ? '52vh' : 0,
          transition: 'height 0.3s ease',
          background: 'rgba(15,23,42,0.97)',
          overflow: 'hidden',
        }}>
          <div style={{ height: '52vh', overflowY: 'auto', padding: '12px 16px' }}>
            <PanelContent
              aggregatedObs={aggregatedObs}
              selectedHotspot={selectedHotspot}
              speciesList={speciesList}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    )
  }

  // Desktop: right-side panel with collapse tab
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 10,
      display: 'flex', alignItems: 'stretch',
    }}>
      {/* Collapse tab */}
      <button
        onClick={onToggle}
        style={{
          alignSelf: 'center',
          background: '#1e293b', color: '#94a3b8',
          border: '1px solid #334155', borderRight: 'none',
          borderRadius: '6px 0 0 6px',
          padding: '12px 4px', cursor: 'pointer', fontSize: 11,
          writingMode: 'vertical-rl',
        }}
      >
        {isOpen ? '▶' : '◀'}
      </button>

      {/* Panel body */}
      <div style={{
        width: isOpen ? 320 : 0,
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        background: 'rgba(15,23,42,0.93)',
        borderLeft: '1px solid #1e293b',
      }}>
        <div style={{ width: 320, height: '100%', overflowY: 'auto', padding: 16, color: '#f1f5f9' }}>
          <PanelContent
            aggregatedObs={aggregatedObs}
            selectedHotspot={selectedHotspot}
            speciesList={speciesList}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  )
}
