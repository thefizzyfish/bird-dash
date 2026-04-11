import { useState, useEffect } from 'react'

const cache = {}

export function useBirdPhoto(sciName) {
  const [url, setUrl] = useState(cache[sciName] ?? null)

  useEffect(() => {
    if (!sciName || cache[sciName] !== undefined) return
    cache[sciName] = ''  // mark as in-flight
    fetch(`/api/photo?sciName=${encodeURIComponent(sciName)}`)
      .then(r => r.json())
      .then(data => {
        cache[sciName] = data.url ?? ''
        setUrl(cache[sciName])
      })
      .catch(() => { cache[sciName] = '' })
  }, [sciName])

  return url
}
