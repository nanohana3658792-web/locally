import { useMemo, useRef, useState } from 'react'
import type { DemoPattern, LatLng, PolygonArea } from '../../types'

interface SimpleMapProps {
  pattern: DemoPattern
  userLocation: LatLng
  onChangeUserLocation: (next: LatLng) => void
  highlightedAreaIds: string[]
  focusedStoreIds: string[]
}

const W = 760
const H = 520

export function SimpleMap({ pattern, userLocation, onChangeUserLocation, highlightedAreaIds, focusedStoreIds }: SimpleMapProps) {
  const [zoom, setZoom] = useState(pattern.mapConfig.zoomLevel)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  const center = pattern.mapConfig.center

  const toScreen = (p: LatLng) => {
    const x = (p.lng - center.lng) * 100000 * zoom + W / 2 + pan.x
    const y = (center.lat - p.lat) * 100000 * zoom + H / 2 + pan.y
    return { x, y }
  }

  const toGeo = (x: number, y: number): LatLng => {
    const lng = ((x - W / 2 - pan.x) / (100000 * zoom)) + center.lng
    const lat = center.lat - ((y - H / 2 - pan.y) / (100000 * zoom))
    return { lat, lng }
  }

  const allAreas: PolygonArea[] = useMemo(
    () => pattern.stores.flatMap((store) => store.polygonAreas),
    [pattern],
  )

  const scaleMeters = Math.max(20, Math.round(200 / zoom / 10) * 10)
  const scalePx = scaleMeters / (111000 / (100000 * zoom))

  return (
    <div className="map-wrap">
      <svg
        className="map-svg"
        viewBox={`0 0 ${W} ${H}`}
        onClick={(e) => {
          const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const x = ((e.clientX - box.left) / box.width) * W
          const y = ((e.clientY - box.top) / box.height) * H
          onChangeUserLocation(toGeo(x, y))
        }}
        onWheel={(e) => {
          e.preventDefault()
          setZoom((z) => {
            const delta = e.deltaY < 0 ? 0.15 : -0.15
            const next = Math.min(pattern.mapConfig.maxZoom, Math.max(pattern.mapConfig.minZoom, z + delta))
            return Number(next.toFixed(2))
          })
        }}
        onMouseDown={(e) => {
          setIsDragging(true)
          dragStart.current = { x: e.clientX, y: e.clientY }
        }}
        onMouseMove={(e) => {
          if (!isDragging || !dragStart.current) return
          const dx = e.clientX - dragStart.current.x
          const dy = e.clientY - dragStart.current.y
          dragStart.current = { x: e.clientX, y: e.clientY }
          setPan((p) => ({ x: p.x + dx * (W / (e.currentTarget.getBoundingClientRect().width || 1)), y: p.y + dy * (H / (e.currentTarget.getBoundingClientRect().height || 1)) }))
        }}
        onMouseUp={() => {
          setIsDragging(false)
          dragStart.current = null
        }}
        onMouseLeave={() => {
          setIsDragging(false)
          dragStart.current = null
        }}
      >
        <rect x="0" y="0" width={W} height={H} fill="#f7fafc" />

        {allAreas.map((area) => {
          const points = area.vertices.map((v) => {
            const p = toScreen(v)
            return `${p.x},${p.y}`
          }).join(' ')
          const isHighlighted = highlightedAreaIds.includes(area.id)
          const isFocusedStore = focusedStoreIds.length === 0 || focusedStoreIds.includes(area.storeId)
          return (
            <polygon
              key={area.id}
              points={points}
              fill={area.color}
              fillOpacity={isHighlighted ? 0.6 : area.opacity}
              stroke={isHighlighted ? '#111827' : area.color}
              strokeWidth={isHighlighted ? 3 : isFocusedStore ? 1.5 : 1}
              strokeOpacity={isFocusedStore ? 1 : 0.4}
            />
          )
        })}

        {pattern.stores.map((store) => {
          const p = toScreen(store.position)
          return (
            <g key={store.id}>
              <circle cx={p.x} cy={p.y} r="5" fill="#111827" />
              <text x={p.x + 8} y={p.y - 8} fontSize="11" fill="#111827">{store.name}</text>
            </g>
          )
        })}

        {(() => {
          const p = toScreen(userLocation)
          return (
            <g>
              <circle cx={p.x} cy={p.y} r="8" fill="#22c55e" />
              <circle cx={p.x} cy={p.y} r="14" fill="#22c55e" fillOpacity="0.2" />
            </g>
          )
        })()}

        <g transform={`translate(${W - 170}, ${H - 36})`}>
          <line x1="0" y1="0" x2={scalePx} y2="0" stroke="#111" strokeWidth="3" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#111" strokeWidth="2" />
          <line x1={scalePx} y1="-6" x2={scalePx} y2="6" stroke="#111" strokeWidth="2" />
          <text x={scalePx + 8} y="4" fontSize="12" fill="#111">{scaleMeters >= 1000 ? `${(scaleMeters / 1000).toFixed(1)}km` : `${scaleMeters}m`}</text>
        </g>
      </svg>

      <div className="map-toolbar">
        <button onClick={() => setZoom((z) => Math.min(pattern.mapConfig.maxZoom, z + 0.2))}>＋</button>
        <button onClick={() => setZoom((z) => Math.max(pattern.mapConfig.minZoom, z - 0.2))}>−</button>
        <span>ズーム: {zoom.toFixed(1)}</span>
      </div>

      <div className="legend">
        {pattern.stores.map((store, idx) => (
          <span key={store.id}><i style={{ background: idx === 0 ? '#ff3b30' : '#007aff' }} />{store.name}</span>
        ))}
      </div>
    </div>
  )
}
