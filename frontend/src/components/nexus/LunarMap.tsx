import { AlertTriangle, Radio, ScanLine, Sun } from 'lucide-react'
import type { AssetId } from '../../types/nexus'
import { useNexusStore } from '../../store/nexusStore'
import { NEXUS_STATUS_COLORS, ORIGINAL_ROUTE_POINTS, RESCUE_ROUTE_POINTS } from '../../utils/nexusData'

function points(values: Array<[number, number]>) {
  return values.map(([x, y]) => `${x},${y}`).join(' ')
}

export function LunarMap({ compact = false }: { compact?: boolean }) {
  const assets = useNexusStore(state => state.assets)
  const selected = useNexusStore(state => state.selectedAssetId)
  const selectAsset = useNexusStore(state => state.selectAsset)
  const plan = useNexusStore(state => state.plan)
  const stage = useNexusStore(state => state.simulation.scenarioStage)

  const assetColors: Record<AssetId, string> = { 'astra-1': '#22d3ee', nova: '#a78bfa', selene: '#21d99a' }
  return (
    <div className="relative h-full min-h-[310px] overflow-hidden rounded-xl border border-white/[0.07] bg-[#070c18]">
      <svg viewBox="0 0 100 82" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-label="Interactive lunar mission map">
        <defs>
          <radialGradient id="moonGlow" cx="70%" cy="20%" r="65%"><stop offset="0" stopColor="#1b3452" stopOpacity=".68" /><stop offset="1" stopColor="#050812" stopOpacity=".2" /></radialGradient>
          <pattern id="mapGrid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="#6ee7f9" strokeOpacity=".055" strokeWidth=".25" /></pattern>
          <filter id="routeGlow"><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="100" height="82" fill="url(#moonGlow)" />
        <rect width="100" height="82" fill="url(#mapGrid)" />
        <g fill="#0a1322" stroke="#607897" strokeOpacity=".18" strokeWidth=".5">
          <ellipse cx="52" cy="57" rx="15" ry="8" /><ellipse cx="76" cy="48" rx="8" ry="5" />
          <ellipse cx="35" cy="30" rx="10" ry="6" /><ellipse cx="16" cy="56" rx="7" ry="4" />
        </g>
        <ellipse cx="85" cy="18" rx="13" ry="11" fill="#fbbf24" fillOpacity=".09" stroke="#fbbf24" strokeOpacity=".46" strokeDasharray="2 1" />
        <ellipse cx="61" cy="42" rx="11" ry="9" fill="#ef4444" fillOpacity=".09" stroke="#ef4444" strokeOpacity=".38" strokeDasharray="1.5 1.2" />
        <ellipse cx="46" cy="23" rx="9" ry="7" fill="#8b5cf6" fillOpacity=".08" stroke="#8b5cf6" strokeOpacity=".42" strokeDasharray="2 1" />
        <polyline points={points(ORIGINAL_ROUTE_POINTS)} fill="none" stroke="#64748b" strokeOpacity=".65" strokeWidth=".7" strokeDasharray="2 1.4" />
        {(plan || stage >= 5) && <polyline points={points(RESCUE_ROUTE_POINTS)} fill="none" stroke="#22d3ee" strokeOpacity=".95" strokeWidth="1.1" filter="url(#routeGlow)" />}
        {stage < 7 && <line x1="14" y1="24" x2="26" y2="69" stroke="#21d99a" strokeOpacity=".36" strokeWidth=".45" strokeDasharray="1.5 1" />}
        <line x1="14" y1="24" x2="43" y2="49" stroke="#a78bfa" strokeOpacity=".45" strokeWidth=".45" strokeDasharray="1.5 1" />
        <line x1="43" y1="49" x2="26" y2="69" stroke="#22d3ee" strokeOpacity=".45" strokeWidth=".45" strokeDasharray="1.5 1" />
        {assets.map(asset => (
          <g key={asset.id} transform={`translate(${asset.mapPosition[0]} ${asset.mapPosition[1]})`} role="button" onClick={() => selectAsset(asset.id)} className="cursor-pointer">
            <circle r={selected === asset.id ? 3.5 : 2.7} fill={assetColors[asset.id]} fillOpacity=".14" stroke={assetColors[asset.id]} strokeWidth={selected === asset.id ? '.8' : '.45'}>
              <animate attributeName="r" values={`${selected === asset.id ? 2.8 : 2.3};${selected === asset.id ? 4 : 3.3};${selected === asset.id ? 2.8 : 2.3}`} dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle r="1.25" fill={NEXUS_STATUS_COLORS[asset.status]} />
            <text y="-4.2" textAnchor="middle" fill="#dff8ff" fontSize="2.3" fontWeight="600">{asset.name}</text>
          </g>
        ))}
      </svg>
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className="map-key"><AlertTriangle size={10} className="text-red-400" /> Hazard</span>
        <span className="map-key"><Sun size={10} className="text-amber-300" /> High sunlight</span>
        <span className="map-key"><ScanLine size={10} className="text-purple-300" /> Science</span>
        <span className="map-key"><Radio size={10} className="text-slate-400" /> Comm dead zone</span>
      </div>
      {!compact && <div className="absolute bottom-3 left-3 rounded-md border border-white/[0.06] bg-[#07101ddd] px-2 py-1 text-[10px] text-slate-400">Select an asset • A* route updates after incident confirmation</div>}
      <div className="absolute bottom-3 right-3 text-right text-[9px] uppercase tracking-[0.16em] text-slate-600">Shackleton east ridge<br />synthetic terrain grid</div>
    </div>
  )
}
