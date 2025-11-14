import { useEffect, useMemo, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

function Stat({ label, value, suffix = '' }) {
  return (
    <div className="p-4 bg-white/70 rounded-lg shadow-sm border">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-800">{value}{suffix}</div>
    </div>
  )
}

function RecommendationCard({ rec }) {
  return (
    <div className="p-4 rounded-xl bg-white/80 shadow border hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-semibold text-emerald-700">{rec.crop}</h3>
        <span className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">Score {rec.score}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="bg-emerald-50 rounded p-2"><div className="text-gray-500">Yield</div><div className="font-medium">{rec.expected_yield_tpha} t/ha</div></div>
        <div className="bg-blue-50 rounded p-2"><div className="text-gray-500">Profit</div><div className="font-medium">{Math.round(rec.profit_index*100)}%</div></div>
        <div className="bg-amber-50 rounded p-2"><div className="text-gray-500">Sustainability</div><div className="font-medium">{Math.round(rec.sustainability_score*100)}%</div></div>
      </div>
      {rec.notes && <p className="mt-3 text-sm text-gray-600">{rec.notes}</p>}
    </div>
  )
}

export default function App() {
  const [lat, setLat] = useState('22.57')
  const [lon, setLon] = useState('88.36')

  const [soil, setSoil] = useState({ ph: 6.8, moisture: 55, nitrogen: 100, phosphorus: 40, potassium: 80 })
  const [weather, setWeather] = useState({ rainfall_mm: 800, temperature_c: 28 })
  const [market, setMarket] = useState({ demand_index: 0.6, price_index: 0.6 })
  const [prevCrops, setPrevCrops] = useState('wheat,rice')

  const [loading, setLoading] = useState(false)
  const [recs, setRecs] = useState([])
  const [warning, setWarning] = useState('')

  const previousCropsArray = useMemo(
    () => prevCrops.split(',').map(s => s.trim()).filter(Boolean),
    [prevCrops]
  )

  async function autofill() {
    setLoading(true)
    setWarning('')
    try {
      const res = await fetch(`${BACKEND}/api/auto-data?lat=${lat}&lon=${lon}`)
      const data = await res.json()
      if (data.soil) setSoil(data.soil)
      if (data.weather) setWeather(data.weather)
      if (data.market) setMarket(data.market)
    } catch (e) {
      setWarning('Could not fetch auto data. Using current values.')
    } finally {
      setLoading(false)
    }
  }

  async function getRecommendations() {
    setLoading(true)
    setWarning('')
    try {
      const res = await fetch(`${BACKEND}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: `${lat},${lon}`,
          soil,
          weather,
          previous_crops: previousCropsArray,
          market,
          preferred_language: 'en'
        })
      })
      const data = await res.json()
      setRecs(data.recommendations || [])
    } catch (e) {
      setWarning('Failed to get recommendations. Check backend URL.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Attempt to autofill on first load
    autofill()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-emerald-50 to-sky-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-700">AI-Based Crop Recommendation</h1>
          <p className="text-gray-600 mt-2">Personalized, data-driven crop advice considering soil, weather, rotation and market.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-4 bg-white/80 rounded-xl shadow border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Latitude</label>
                  <input value={lat} onChange={e=>setLat(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Longitude</label>
                  <input value={lon} onChange={e=>setLon(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded focus:outline-none" />
                </div>
                <button onClick={autofill} className="col-span-2 md:col-span-1 self-end px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50" disabled={loading}>
                  {loading ? 'Loading...' : 'Auto-fill from APIs'}
                </button>
                <button onClick={getRecommendations} className="col-span-2 md:col-span-1 self-end px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
                  {loading ? 'Please wait...' : 'Get Recommendations'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-white/80 rounded-xl shadow border">
              <h2 className="font-semibold text-gray-800 mb-3">Soil</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Stat label="pH" value={soil.ph} />
                <Stat label="Moisture" value={soil.moisture} suffix="%" />
                <Stat label="Nitrogen" value={soil.nitrogen} />
                <Stat label="Phosphorus" value={soil.phosphorus} />
                <Stat label="Potassium" value={soil.potassium} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                <input type="number" step="0.1" value={soil.ph} onChange={e=>setSoil({...soil, ph: Number(e.target.value)})} className="px-3 py-2 border rounded" />
                <input type="number" step="1" value={soil.moisture} onChange={e=>setSoil({...soil, moisture: Number(e.target.value)})} className="px-3 py-2 border rounded" />
                <input type="number" step="1" value={soil.nitrogen} onChange={e=>setSoil({...soil, nitrogen: Number(e.target.value)})} className="px-3 py-2 border rounded" />
                <input type="number" step="1" value={soil.phosphorus} onChange={e=>setSoil({...soil, phosphorus: Number(e.target.value)})} className="px-3 py-2 border rounded" />
                <input type="number" step="1" value={soil.potassium} onChange={e=>setSoil({...soil, potassium: Number(e.target.value)})} className="px-3 py-2 border rounded" />
              </div>
            </div>

            <div className="p-4 bg-white/80 rounded-xl shadow border">
              <h2 className="font-semibold text-gray-800 mb-3">Weather & Market</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Rainfall (mm)</label>
                  <input type="number" value={weather.rainfall_mm} onChange={e=>setWeather({...weather, rainfall_mm: Number(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Temperature (°C)</label>
                  <input type="number" step="0.1" value={weather.temperature_c} onChange={e=>setWeather({...weather, temperature_c: Number(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Demand Index</label>
                  <input type="number" step="0.01" min="0" max="1" value={market.demand_index} onChange={e=>setMarket({...market, demand_index: Number(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Price Index</label>
                  <input type="number" step="0.01" min="0" max="1" value={market.price_index} onChange={e=>setMarket({...market, price_index: Number(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/80 rounded-xl shadow border">
              <h2 className="font-semibold text-gray-800 mb-3">Crop Rotation</h2>
              <input value={prevCrops} onChange={e=>setPrevCrops(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="e.g., wheat,rice" />
              <p className="text-xs text-gray-500 mt-2">Comma-separated previous crops from recent seasons.</p>
            </div>

            {warning && <div className="p-3 rounded bg-amber-100 text-amber-800">{warning}</div>}

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {recs.map((r, i) => (
                <RecommendationCard key={i} rec={r} />
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-600 text-white shadow">
              <h3 className="text-lg font-semibold">How it works</h3>
              <p className="text-sm mt-2 text-emerald-50">Enter or auto-fill your local conditions. The engine scores common crops considering soil, weather, rotation and market, and presents the best options with yield and profit indicators.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/80 shadow border">
              <h3 className="font-semibold text-gray-800">Vision</h3>
              <p className="text-sm text-gray-600 mt-2">This prototype sets the base for a multilingual, voice-enabled assistant with image understanding for disease detection and offline-first support.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
