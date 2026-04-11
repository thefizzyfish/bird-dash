import { useState, useRef, useEffect } from 'react'

const styles = {
  wrapper: { position: 'relative' },
  input: {
    background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155',
    borderRadius: 6, padding: '6px 28px 6px 10px', fontSize: 13, width: 200,
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
    borderBottom: '1px solid #0f172a', color: '#f1f5f9',
  },
  hint: { padding: '7px 10px', fontSize: 12, color: '#475569', fontStyle: 'italic' },
}

export default function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function search(q) {
    if (!q || q.length < 3) { setResults([]); setOpen(false); return }
    setLoading(true)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`
    fetch(url, { headers: { 'Accept-Language': 'en' } })
      .then(r => r.json())
      .then(data => {
        setResults(data)
        setHighlightedIndex(0)
        setOpen(true)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  function handleSelect(result) {
    setQuery(result.display_name.split(',')[0])
    setResults([])
    setOpen(false)
    onSelect({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); handleSelect(results[highlightedIndex]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div style={styles.wrapper} ref={wrapperRef}>
      <div style={{ position: 'relative' }}>
        <input
          style={styles.input}
          placeholder="Search location..."
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button style={styles.clearBtn} onClick={handleClear}>×</button>
        )}
      </div>
      {open && (
        <div style={styles.dropdown}>
          {loading
            ? <div style={styles.hint}>Searching...</div>
            : results.length === 0
              ? <div style={styles.hint}>No results</div>
              : results.map((r, i) => (
                <div
                  key={r.place_id}
                  style={{ ...styles.option, background: i === highlightedIndex ? '#334155' : 'transparent' }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  onMouseDown={() => handleSelect(r)}
                >
                  <div style={{ fontWeight: 500 }}>{r.display_name.split(',')[0]}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {r.display_name.split(',').slice(1, 3).join(',').trim()}
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}
