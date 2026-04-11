import { useState, useEffect, useRef } from 'react'
import { fetchTaxonomy } from '../api/ebird.js'

const styles = {
  wrapper: { position: 'relative' },
  input: {
    background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155',
    borderRadius: 6, padding: '6px 10px', fontSize: 13, width: 200,
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#64748b', fontSize: 16,
    cursor: 'pointer', padding: 0, lineHeight: 1,
  },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2,
    background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
    maxHeight: 220, overflowY: 'auto', zIndex: 100,
  },
  option: {
    padding: '7px 10px', fontSize: 12, cursor: 'pointer',
    borderBottom: '1px solid #0f172a',
  },
  hint: {
    padding: '7px 10px', fontSize: 12, color: '#475569', fontStyle: 'italic',
  },
}

export default function SpeciesSearch({ onSelect, onClear, selectedSpecies }) {
  const [taxonomy, setTaxonomy] = useState(null)  // null = loading
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const wrapperRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    fetchTaxonomy().then(setTaxonomy).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedSpecies) setQuery(selectedSpecies.comName)
  }, [selectedSpecies])

  useEffect(() => {
    if (!taxonomy || !query || query.length < 2) { setSuggestions([]); return }
    const q = query.toLowerCase()
    setSuggestions(
      taxonomy
        .filter(s => s.comName?.toLowerCase().includes(q) || s.sciName?.toLowerCase().includes(q))
        .slice(0, 8)
    )
    setHighlightedIndex(0)
    setOpen(true)
  }, [query, taxonomy])

  useEffect(() => {
    function handle(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleSelect(species) {
    setQuery(species.comName)
    setSuggestions([])
    setOpen(false)
    onSelect(species)
  }

  function handleClear() {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    onClear()
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(suggestions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const loading = taxonomy === null
  const showDropdown = open && query.length >= 2

  return (
    <div style={styles.wrapper} ref={wrapperRef}>
      <div style={{ position: 'relative' }}>
        <input
          style={styles.input}
          placeholder={loading ? 'Loading species...' : 'Search species...'}
          disabled={loading}
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) onClear() }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && !loading && (
          <button style={styles.clearBtn} onClick={handleClear}>×</button>
        )}
      </div>
      {showDropdown && (
        <div style={styles.dropdown} ref={listRef}>
          {suggestions.length === 0
            ? <div style={styles.hint}>No matches</div>
            : suggestions.map((s, i) => (
              <div
                key={s.speciesCode}
                style={{
                  ...styles.option,
                  background: i === highlightedIndex ? '#334155' : 'transparent',
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
                onMouseDown={() => handleSelect(s)}
              >
                <div style={{ color: '#f1f5f9', fontWeight: 500 }}>{s.comName}</div>
                <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: 11 }}>{s.sciName}</div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
