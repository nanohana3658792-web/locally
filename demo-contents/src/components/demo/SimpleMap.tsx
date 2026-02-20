import { useMemo, useRef, useState } from 'react'
import type { DemoPattern, LatLng, PolygonArea } from '../../types'

interface SimpleMapProps {
  pattern: DemoPattern
  onChangeUserLocation: (next: LatLng) => void
  highlightedAreaIds: string[]
  focusedStoreIds: string[]
  monochromeNonHighlighted?: boolean
}

const W = 760
const H = 520

export function SimpleMap({ pattern, onChangeUserLocation, highlightedAreaIds, focusedStoreIds, monochromeNonHighlighted = false }: SimpleMapProps) {
  const zoom = pattern.mapConfig.zoomLevel
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

  const scaleMeters = 100
  const scalePx = scaleMeters / (111000 / (100000 * zoom))

  return (
    <div className="flex flex-col gap-2">
      <svg
        className="h-auto w-full touch-none rounded-lg border border-slate-300 bg-slate-50"
        viewBox={`0 0 ${W} ${H}`}
        onClick={(e) => {
          const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const x = ((e.clientX - box.left) / box.width) * W
          const y = ((e.clientY - box.top) / box.height) * H
          onChangeUserLocation(toGeo(x, y))
          setPan((p) => ({ x: p.x + (W / 2 - x), y: p.y + (H / 2 - y) }))
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
        <rect x="0" y="0" width={W} height={H} fill="#eef2f7" />
        <rect x="40" y="28" width={W - 80} height={H - 56} rx="14" fill="#f8fafc" stroke="#d1d5db" strokeWidth="1" />

        {[90, 180, 270, 360, 450, 540, 630].map((x) => (
          <line key={`v-${x}`} x1={x} y1="28" x2={x} y2={H - 28} stroke="#e5e7eb" strokeWidth="1" />
        ))}
        {[80, 150, 220, 290, 360, 430].map((y) => (
          <line key={`h-${y}`} x1="40" y1={y} x2={W - 40} y2={y} stroke="#e5e7eb" strokeWidth="1" />
        ))}

        <path d="M 60 120 C 180 80, 260 160, 360 130 S 560 110, 700 150" stroke="#cbd5e1" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M 90 360 C 240 330, 320 420, 460 380 S 620 350, 700 390" stroke="#cbd5e1" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M 160 40 C 150 150, 180 260, 170 480" stroke="#dbeafe" strokeWidth="18" fill="none" strokeLinecap="round" />

        <path d="M 80 210 C 210 170, 340 210, 470 190 S 620 180, 700 200" stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="8 6" />
        <path d="M 120 430 C 260 390, 360 420, 520 400 S 640 360, 700 350" stroke="#8b5cf6" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="10 6" />
        {[{ x: 180, y: 196 }, { x: 320, y: 203 }, { x: 500, y: 188 }, { x: 620, y: 190 }].map((s, idx) => (
          <circle key={`st-a-${idx}`} cx={s.x} cy={s.y} r="4" fill="#ffffff" stroke="#b45309" strokeWidth="2" />
        ))}
        {[{ x: 200, y: 415 }, { x: 360, y: 410 }, { x: 540, y: 392 }, { x: 650, y: 364 }].map((s, idx) => (
          <circle key={`st-b-${idx}`} cx={s.x} cy={s.y} r="4" fill="#ffffff" stroke="#6d28d9" strokeWidth="2" />
        ))}
        <text x="78" y="226" fontSize="10" fill="#92400e" fontWeight="700">路線A</text>
        <text x="118" y="446" fontSize="10" fill="#5b21b6" fontWeight="700">路線B</text>

        <g transform="translate(52, 44)">
          <rect x="0" y="0" width="120" height="32" rx="8" fill="#111827" fillOpacity="0.9" />
          <text x="12" y="21" fontSize="13" fill="#f9fafb" fontWeight="700">簡易地図（概念図）</text>
        </g>

        <g transform={`translate(${W - 54}, 56)`}>
          <path d="M 0 -14 L 6 4 L 0 1 L -6 4 Z" fill="#111827" />
          <text x="-4" y="18" fontSize="11" fill="#111827" fontWeight="700">N</text>
        </g>

        {allAreas.map((area) => {
          const screenPoints = area.vertices.map((v) => {
            const p = toScreen(v)
            return p
          })
          const points = screenPoints.map((p) => `${p.x},${p.y}`).join(' ')
          const minX = Math.min(...screenPoints.map((p) => p.x))
          const minY = Math.min(...screenPoints.map((p) => p.y))
          const labelX = minX + 10
          const labelY = minY + 10
          const isHighlighted = highlightedAreaIds.includes(area.id)
          const isFocusedStore = focusedStoreIds.length === 0 || focusedStoreIds.includes(area.storeId)
          const isMonochromeArea = monochromeNonHighlighted && !isHighlighted
          const areaFill = isMonochromeArea ? '#9ca3af' : area.color
          const areaStroke = isHighlighted ? '#111827' : isMonochromeArea ? '#6b7280' : area.color
          return (
            <g key={area.id}>
              <polygon
                points={points}
                fill={areaFill}
                fillOpacity={isHighlighted ? 0.6 : isMonochromeArea ? 0.2 : area.opacity}
                stroke={areaStroke}
                strokeWidth={isHighlighted ? 3 : isFocusedStore ? 1.5 : 1}
                strokeOpacity={isFocusedStore ? 1 : 0.4}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="start"
                dominantBaseline="hanging"
                fontSize="12"
                fontWeight="700"
                fill={areaFill}
                stroke="#ffffff"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {area.productShortId}
              </text>
            </g>
          )
        })}

        {(() => {
          const p = { x: W / 2, y: H / 2 }
          return (
            <g>
              <circle cx={p.x} cy={p.y} r="20" fill="#3b82f6" fillOpacity="0.12" />
              <circle cx={p.x} cy={p.y} r="11" fill="none" stroke="#1d4ed8" strokeWidth="2.5" />
              <line x1={p.x - 15} y1={p.y} x2={p.x + 15} y2={p.y} stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
              <line x1={p.x} y1={p.y - 15} x2={p.x} y2={p.y + 15} stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={p.x} cy={p.y} r="3.6" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.2" />
            </g>
          )
        })()}

        <g transform={`translate(${W - 230}, ${H - 58})`}>
          <rect x="0" y="-18" width="190" height="30" rx="6" fill="#ffffff" fillOpacity="0.92" stroke="#cbd5e1" />
          <line x1="14" y1="-3" x2={14 + scalePx} y2="-3" stroke="#111" strokeWidth="3" />
          <line x1="14" y1="-9" x2="14" y2="3" stroke="#111" strokeWidth="2" />
          <line x1={14 + scalePx} y1="-9" x2={14 + scalePx} y2="3" stroke="#111" strokeWidth="2" />
          <text x={14 + scalePx + 8} y="1" fontSize="12" fill="#111">{scaleMeters}m</text>
        </g>
      </svg>

      <div className="flex flex-wrap gap-2.5">
        {pattern.stores.map((store) => (
          <span key={store.id} className="inline-flex items-center gap-1.5 text-sm text-slate-700">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: store.polygonAreas[0]?.color ?? '#94a3b8' }} />
            {store.name}
          </span>
        ))}
      </div>
    </div>
  )
}
