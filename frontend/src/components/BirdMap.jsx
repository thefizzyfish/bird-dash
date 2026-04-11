import Map, { useControl } from 'react-map-gl/maplibre'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { ScatterplotLayer } from '@deck.gl/layers'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

const HEATMAP_COLORS = [
  [0,   0,   255, 0],
  [0,   100, 255, 100],
  [0,   200, 200, 160],
  [255, 255, 0,   210],
  [255, 120, 0,   230],
  [255, 0,   0,   255],
]

function DeckGLOverlay({ layers }) {
  const overlay = useControl(() => new MapboxOverlay({ interleaved: false }))
  overlay.setProps({ layers })
  return null
}

export default function BirdMap({
  viewport, onViewportChange, heatmapPoints, hotspots, onSelectHotspot, selectedHotspot, speciesSightings
}) {
  const layers = [
    new HeatmapLayer({
      id: 'heatmap',
      data: heatmapPoints,
      getPosition: d => [d.lng, d.lat],
      getWeight: d => d.weight,
      radiusPixels: 60,
      intensity: 1.2,
      threshold: 0.05,
      colorRange: HEATMAP_COLORS,
    }),
    new ScatterplotLayer({
      id: 'hotspots',
      data: hotspots,
      getPosition: d => [d.lng, d.lat],
      radiusUnits: 'pixels',
      getRadius: d => Math.max(4, Math.min(10, Math.sqrt(d.numSpeciesAllTime || 0) * 0.4)),
      getFillColor: d =>
        selectedHotspot?.locId === d.locId
          ? [255, 200, 0, 230]
          : [34, 197, 94, 200],
      stroked: true,
      getLineColor: [0, 0, 0, 80],
      lineWidthMinPixels: 1,
      pickable: true,
      onClick: info => info.object && onSelectHotspot(info.object),
      updateTriggers: { getFillColor: selectedHotspot?.locId },
    }),
    new ScatterplotLayer({
      id: 'species-sightings',
      data: speciesSightings,
      getPosition: d => [d.lng, d.lat],
      radiusUnits: 'pixels',
      getRadius: 8,
      getFillColor: [251, 191, 36, 230],   // amber
      stroked: true,
      getLineColor: [180, 120, 0, 200],
      lineWidthMinPixels: 1.5,
      pickable: false,
    }),
  ]

  return (
    <Map
      {...viewport}
      mapStyle={STYLE_URL}
      onMove={e => onViewportChange(e.viewState)}
      style={{ width: '100%', height: '100%' }}
    >
      <DeckGLOverlay layers={layers} />
    </Map>
  )
}
