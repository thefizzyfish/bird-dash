import { useState, useEffect } from 'react'
import { useBirdPhoto } from '../hooks/useBirdPhoto.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { fetchChecklist } from '../api/ebird.js'

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
  clickableRow: {
    marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #1e293b',
    cursor: 'pointer', borderRadius: 4,
  },
}

function formatDate(obsDt) {
  if (!obsDt) return ''
  return obsDt.split(' ')[0]
}

function formatDuration(hrs) {
  if (!hrs) return null
  const h = Math.floor(hrs)
  const m = Math.round((hrs - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
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

function ChecklistView({ species, checklist, loading, onBack }) {
  return (
    <>
      <button style={s.backBtn} onClick={onBack}>← Species List</button>
      <div style={{ ...s.name, marginBottom: 2 }}>{species.comName}</div>
      <div style={{ ...s.sci, marginBottom: 14 }}>{species.sciName}</div>

      {loading && <p style={s.empty}>Loading checklist…</p>}

      {!loading && checklist && (
        <>
          <div style={s.heading}>CHECKLIST</div>
          <div style={{ ...s.item }}>
            <div style={s.meta}>
              <span style={{ color: '#f1f5f9' }}>{checklist.userDisplayName}</span>
              {checklist.numObservers > 1 && ` + ${checklist.numObservers - 1} others`}
            </div>
            <div style={s.meta}>{checklist.obsDt}{checklist.obsTime ? ` at ${checklist.obsTime}` : ''}</div>
            {formatDuration(checklist.durationHrs) && (
              <div style={s.meta}>{formatDuration(checklist.durationHrs)}
                {checklist.effortDistanceKm ? ` · ${checklist.effortDistanceKm.toFixed(1)} km` : ''}
              </div>
            )}
            {checklist.obs && (
              <div style={s.meta}>{checklist.obs.length} species reported</div>
            )}
            {checklist.checklistComments && (
              <div style={{ ...s.meta, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
                "{checklist.checklistComments}"
              </div>
            )}
            <a
              href={`https://ebird.org/checklist/${species.subId}`}
              target="_blank" rel="noreferrer"
              style={{ ...s.link, display: 'inline-block', marginTop: 8 }}
            >
              View full checklist on eBird →
            </a>
          </div>
        </>
      )}

      {!loading && !checklist && (
        <p style={s.empty}>Could not load checklist.</p>
      )}
    </>
  )
}

function PanelFooter() {
  return (
    <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #1e293b', textAlign: 'center' }}>
      <a
        href="https://www.instagram.com/stork_n_stout"
        target="_blank" rel="noreferrer"
        style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
      >
        📸 @stork_n_stout
      </a>
    </div>
  )
}

function PanelContent({ aggregatedObs, selectedHotspot, speciesList, selectedRareLocation, onClose }) {
  const [activeSpecies, setActiveSpecies] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [checklistLoading, setChecklistLoading] = useState(false)

  // Reset checklist state when hotspot changes
  useEffect(() => {
    setActiveSpecies(null)
    setChecklist(null)
  }, [selectedHotspot])

  useEffect(() => {
    if (!activeSpecies?.subId) return
    setChecklist(null)
    setChecklistLoading(true)
    fetchChecklist({ subId: activeSpecies.subId })
      .then(setChecklist)
      .catch(console.error)
      .finally(() => setChecklistLoading(false))
  }, [activeSpecies])

  if (selectedRareLocation) {
    return (
      <>
        <button style={s.backBtn} onClick={onClose}>← All Birds</button>
        <div style={{ ...s.hotspotTitle, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#ef4444', fontSize: 10 }}>●</span>
          {selectedRareLocation.locName}
        </div>
        <div style={s.hotspotMeta}>{selectedRareLocation.species.length} rare species</div>
        <div style={s.heading}>RARE SIGHTINGS</div>
        {selectedRareLocation.species.map((sp, i) => (
          <div key={i} style={s.item}>
            <div style={s.name}>{sp.comName}</div>
            <div style={s.sci}>{sp.sciName}</div>
            <div style={s.meta}>{formatDate(sp.obsDt)}{sp.howMany ? ` · ${sp.howMany} seen` : ''}</div>
            {sp.subId && (
              <a href={`https://ebird.org/checklist/${sp.subId}`}
                target="_blank" rel="noreferrer" style={s.link}>
                View checklist →
              </a>
            )}
          </div>
        ))}
        <PanelFooter />
      </>
    )
  }

  if (selectedHotspot) {
    if (activeSpecies) {
      return (
        <>
          <ChecklistView
            species={activeSpecies}
            checklist={checklist}
            loading={checklistLoading}
            onBack={() => { setActiveSpecies(null); setChecklist(null) }}
          />
          <PanelFooter />
        </>
      )
    }

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
            <div
              key={i}
              style={s.clickableRow}
              onClick={() => sp.subId && setActiveSpecies(sp)}
            >
              <div style={s.name}>{sp.comName}</div>
              <div style={s.sci}>{sp.sciName}</div>
              <div style={s.meta}>{formatDate(sp.obsDt)}{sp.howMany ? ` · ${sp.howMany} seen` : ''}</div>
              {sp.subId && <div style={{ ...s.link, marginTop: 3 }}>Latest checklist →</div>}
            </div>
          ))
        }
        <PanelFooter />
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
      <PanelFooter />
    </>
  )
}

export default function SidePanel({ aggregatedObs, selectedHotspot, speciesList, selectedRareLocation, onClose, isOpen, onToggle }) {
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
            {selectedRareLocation
              ? `📍 ${selectedRareLocation.locName}`
              : selectedHotspot
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
              selectedRareLocation={selectedRareLocation}
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
            selectedRareLocation={selectedRareLocation}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  )
}
