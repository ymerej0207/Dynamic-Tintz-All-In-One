
import React, { useMemo, useState } from 'react'

export default function App() {
  // —— Project meta ——
  const [clientFirstName, setClientFirstName] = useState('Claire')
  const [clientEmail, setClientEmail] = useState('claire@example.com')
  const [clientPhone, setClientPhone] = useState('(555) 555-1234')
  const [serviceAddress, setServiceAddress] = useState('123 Commerce Dr, Dallas, TX')
  const [projectName, setProjectName] = useState('Fast-Trak HQ')
  const [milesFrom75409, setMilesFrom75409] = useState(12) // user-entered travel distance

  // —— Line items ——
  const [rows, setRows] = useState([
    { id: 1, area: 'Lobby North', widthIn: 48, heightIn: 72, qty: 2, notes: '' },
    { id: 2, area: 'Conference A', widthIn: 60, heightIn: 60, qty: 3, notes: '' },
  ])

  const addRow = () => {
    const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1
    setRows([...rows, { id: nextId, area: '', widthIn: 0, heightIn: 0, qty: 1, notes: '' }])
  }
  const duplicateRow = (id) => {
    const src = rows.find((r) => r.id === id)
    if (!src) return
    const nextId = Math.max(...rows.map((r) => r.id)) + 1
    setRows([...rows, { ...src, id: nextId }])
  }
  const removeRow = (id) => setRows(rows.filter((r) => r.id !== id))
  const updateRow = (id, patch) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  // —— UI state ——
  const [showSettings, setShowSettings] = useState(false)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)

  // —— Pricing matrices (editable in Settings) ——
  // Ceramic matrix: $12 (0–49), $11 (50–99), $10 (100–199), $9 (200–299), $8 (300–399), $7 (400–499), $6.50 (500+)
  const [ceramicMatrix, setCeramicMatrix] = useState([
    { min: 0, max: 49, rate: 12.0, label: '$12 (0–49)' },
    { min: 50, max: 99, rate: 11.0, label: '$11 (50–99)' },
    { min: 100, max: 199, rate: 10.0, label: '$10 (100–199)' },
    { min: 200, max: 299, rate: 9.0, label: '$9 (200–299)' },
    { min: 300, max: 399, rate: 8.0, label: '$8 (300–399)' },
    { min: 400, max: 499, rate: 7.0, label: '$7 (400–499)' },
    { min: 500, max: Infinity, rate: 6.5, label: '$6.50 (500+)' },
  ])

  // Solar matrix: $7.50 (0–99), $6.50 (100–199), $6.00 (200–299), $5.50 (300–399), $5.00 (400+)
  const [solarMatrix, setSolarMatrix] = useState([
    { min: 0, max: 99, rate: 7.5, label: '$7.50 (0–99)' },
    { min: 100, max: 199, rate: 6.5, label: '$6.50 (100–199)' },
    { min: 200, max: 299, rate: 6.0, label: '$6.00 (200–299)' },
    { min: 300, max: 399, rate: 5.5, label: '$5.50 (300–399)' },
    { min: 400, max: Infinity, rate: 5.0, label: '$5.00 (400+)' },
  ])

  // —— Shop minimum rules ——
  const SHOP_MIN_SQFT = 18 // applies when total <= 18 sq ft
  const SHOP_MIN_LOCAL = 250 // <= 50 mi
  const SHOP_MIN_REMOTE = 350 // > 50 mi

  // —— Helpers ——
  const rowSqft = (r) => ((Number(r.widthIn) || 0) * (Number(r.heightIn) || 0) * (Number(r.qty) || 0)) / 144
  const totalSqft = useMemo(() => rows.reduce((acc, r) => acc + rowSqft(r), 0), [rows])
  const money = (n) => (isNaN(n) ? '$0.00' : `$${n.toFixed(2)}`)

  const findBracket = (matrix, sqft) => matrix.find((t) => sqft >= t.min && sqft <= t.max) || matrix[0]
  const highestRate = (matrix) => (matrix.length ? matrix[0].rate : 0) // first tier is highest rate based on defined arrays

  function calculateFilm(matrix, sqft, miles) {
    // Shop minimum applies only when total sqft <= SHOP_MIN_SQFT
    if (sqft > 0 && sqft <= SHOP_MIN_SQFT) {
      const price = (miles || 0) > 50 ? SHOP_MIN_REMOTE : SHOP_MIN_LOCAL
      return {
        mode: 'shop-min',
        tierLabel: `Shop Minimum (≤${SHOP_MIN_SQFT} sq ft)`,
        original: price,
        finalPrice: price,
        savings: 0,
        tierPct: 0,
      }
    }

    // Matrix pricing when sqft > SHOP_MIN_SQFT
    const bracket = findBracket(matrix, sqft)
    const rate = bracket.rate
    const originalRate = highestRate(matrix)

    const original = originalRate * sqft // baseline for savings messaging
    const finalPrice = rate * sqft
    const savings = Math.max(0, original - finalPrice)
    const tierPct = original > 0 ? Math.round((savings / original) * 100) : 0

    return {
      mode: 'matrix',
      tierLabel: bracket.label,
      original,
      finalPrice,
      savings,
      tierPct,
    }
  }

  const ceramic = useMemo(() => calculateFilm(ceramicMatrix, totalSqft, milesFrom75409), [ceramicMatrix, totalSqft, milesFrom75409])
  const solar = useMemo(() => calculateFilm(solarMatrix, totalSqft, milesFrom75409), [solarMatrix, totalSqft, milesFrom75409])

  const emailHtml = useMemo(() => buildEmailHtml({
    projectName,
    clientFirstName,
    serviceAddress,
    totalSqft,
    ceramic,
    solar,
  }), [projectName, clientFirstName, serviceAddress, totalSqft, ceramic, solar])

  const copyEmailToClipboard = async () => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = emailHtml
    const plain = tempDiv.innerText
    try {
      await navigator.clipboard.writeText(plain)
      alert('Email (plain text) copied. Your mail app will use your signature.')
    } catch (e) {
      alert('Clipboard not available. Use the preview to copy.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dynamic Tintz — Quote Builder (PWA)</h1>
            <p className="text-sm text-slate-600">Responsive, mobile-first. Add to Home Screen on iPhone/iPad.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="rounded-2xl bg-white px-3 py-2 text-sm shadow hover:shadow-md border">Settings</button>
            <button onClick={() => setEmailPreviewOpen(true)} className="rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Generate Email</button>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="Client First Name" value={clientFirstName} onChange={setClientFirstName} placeholder="First name" />
          <Input label="Client Email" value={clientEmail} onChange={setClientEmail} placeholder="email@domain.com" type="email" />
          <Input label="Client Phone" value={clientPhone} onChange={setClientPhone} placeholder="(###) ###-####" />
          <Input label="Service Address" value={serviceAddress} onChange={setServiceAddress} placeholder="Street, City, ST" className="lg:col-span-2" />
          <Input label="Project / Property Name" value={projectName} onChange={setProjectName} placeholder="e.g., Corporate HQ" />
          <Input label="Miles from 75409" value={milesFrom75409} onChange={(v) => setMilesFrom75409(num(v))} placeholder="e.g., 42" />
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Measurements / Line Items</h2>
            <div className="flex gap-2">
              <button onClick={addRow} className="rounded-xl bg-white px-3 py-2 text-sm shadow hover:shadow-md border">+ Add Row</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white shadow border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <Th>Area / Room</Th>
                  <Th>Width (in)</Th>
                  <Th>Height (in)</Th>
                  <Th>Qty</Th>
                  <Th>Sq Ft</Th>
                  <Th>Notes</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <Td>
                      <input className="w-full px-2 py-2 rounded-lg border focus:outline-none focus:ring"
                        value={r.area}
                        onChange={(e) => updateRow(r.id, { area: e.target.value })}
                        placeholder="e.g., Lobby North" />
                    </Td>
                    <Td>
                      <input inputMode="decimal" className="w-24 px-2 py-2 rounded-lg border"
                        value={r.widthIn}
                        onChange={(e) => updateRow(r.id, { widthIn: num(e.target.value) })} />
                    </Td>
                    <Td>
                      <input inputMode="decimal" className="w-24 px-2 py-2 rounded-lg border"
                        value={r.heightIn}
                        onChange={(e) => updateRow(r.id, { heightIn: num(e.target.value) })} />
                    </Td>
                    <Td>
                      <input inputMode="numeric" className="w-20 px-2 py-2 rounded-lg border"
                        value={r.qty}
                        onChange={(e) => updateRow(r.id, { qty: num(e.target.value, 0) })} />
                    </Td>
                    <Td>
                      <div className="w-24 px-2 py-2">{rowSqft(r).toFixed(2)}</div>
                    </Td>
                    <Td>
                      <input className="w-full px-2 py-2 rounded-lg border"
                        value={r.notes}
                        onChange={(e) => updateRow(r.id, { notes: e.target.value })}
                        placeholder="optional" />
                    </Td>
                    <Td>
                      <div className="flex gap-2 justify-end pr-2">
                        <button onClick={() => duplicateRow(r.id)} className="text-blue-600 hover:underline">Duplicate</button>
                        <button onClick={() => removeRow(r.id)} className="text-rose-600 hover:underline">Delete</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white shadow border p-4">
            <h3 className="font-semibold mb-2">Totals</h3>
            <div className="flex items-center justify-between py-1"><span>Total Sq Ft</span><span className="font-semibold">{totalSqft.toFixed(2)}</span></div>
            <div className="flex items-center justify-between py-1"><span>Miles from 75409</span><span className="font-semibold">{Number(milesFrom75409) || 0}</span></div>
            <div className="mt-4 text-xs text-slate-500">Shop minimum applies only when total ≤ {SHOP_MIN_SQFT} sq ft. No stacking with matrix pricing.</div>
          </div>

          <PriceCard
            title="🌟 Premium Ceramic (TSER 69%+)"
            tagline="Our most advanced and most popular choice"
            original={ceramic.original}
            tierLabel={ceramic.tierLabel}
            discountPct={ceramic.tierPct}
            finalPrice={ceramic.finalPrice}
            savings={ceramic.savings}
            highlight
          />

          <PriceCard
            title="Solar Control (Budget-Friendly)"
            tagline="Value-driven comfort and glare reduction"
            original={solar.original}
            tierLabel={solar.tierLabel}
            discountPct={solar.tierPct}
            finalPrice={solar.finalPrice}
            savings={solar.savings}
          />
        </section>

        <section className="mt-6 flex flex-col sm:flex-row gap-3">
          <button onClick={() => setEmailPreviewOpen(true)} className="rounded-2xl bg-blue-600 px-4 py-3 text-white shadow hover:bg-blue-700 w-full sm:w-auto">Generate Email</button>
          <button onClick={copyEmailToClipboard} className="rounded-2xl bg-white px-4 py-3 shadow hover:shadow-md border w-full sm:w-auto">Copy Email (Plain Text)</button>
        </section>

        {showSettings && (
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowSettings(false)}>
            <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Settings</h3>
                <button onClick={() => setShowSettings(false)} className="rounded-xl bg-white px-3 py-2 border text-sm">Close</button>
              </div>
              <p className="text-sm text-slate-600 mb-4">Update pricing matrices without code changes.</p>

              <fieldset className="mb-6">
                <legend className="font-semibold">Premium Ceramic Matrix</legend>
                <MatrixEditor matrix={ceramicMatrix} setMatrix={setCeramicMatrix} />
              </fieldset>

              <fieldset>
                <legend className="font-semibold">Solar Control Matrix</legend>
                <MatrixEditor matrix={solarMatrix} setMatrix={setSolarMatrix} />
              </fieldset>
            </div>
          </div>
        )}

        {emailPreviewOpen && (
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEmailPreviewOpen(false)}>
            <div className="absolute inset-4 sm:inset-10 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Email Preview</h3>
                  <p className="text-xs text-slate-500">Subject: Your Window Film Proposal — {projectName}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyEmailToClipboard} className="rounded-xl bg-blue-600 px-3 py-2 text-white text-sm">Copy Plain Text</button>
                  <button onClick={() => setEmailPreviewOpen(false)} className="rounded-xl bg-white px-3 py-2 border text-sm">Close</button>
                </div>
              </div>
              <iframe title="email" className="flex-1" srcDoc={emailHtml} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring"
      />
    </label>
  )
}

function Th({ children }) {
  return <th className="text-left font-medium px-3 py-2 whitespace-nowrap">{children}</th>
}
function Td({ children }) {
  return <td className="px-3 py-2 align-top">{children}</td>
}

function PriceCard({ title, tagline, original, tierLabel, discountPct, finalPrice, savings, highlight }) {
  return (
    <div className={`rounded-2xl border bg-white shadow p-4 ${highlight ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          {tagline && <p className="text-xs text-slate-600 italic">{tagline}</p>}
        </div>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <Row label="Original price" value={money(original)} />
        <Row label="Tier" value={tierLabel} />
        <Row label="Estimated discount" value={`${discountPct}%`} />
        <Row label={<span className="font-semibold">Your price</span>} value={<span className="font-semibold">{money(finalPrice)}</span>} />
        <Row label="You save" value={money(savings)} />
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-slate-600">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function MatrixEditor({ matrix, setMatrix }) {
  const update = (i, patch) => {
    const next = matrix.slice()
    next[i] = { ...next[i], ...patch }
    next[i].min = Number(next[i].min)
    next[i].max = next[i].max === 'Infinity' ? Infinity : Number(next[i].max)
    next[i].rate = Number(next[i].rate)
    if (!next[i].label) next[i].label = `${money(next[i].rate)} (${next[i].min}–${next[i].max === Infinity ? '+' : next[i].max})`
    setMatrix(next)
  }
  const add = () => setMatrix([...matrix, { min: 0, max: 0, rate: 0, label: 'Custom' }])
  const remove = (i) => setMatrix(matrix.filter((_, idx) => idx !== i))

  return (
    <div className="mt-3 space-y-2">
      {matrix.map((t, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-end">
          <label className="col-span-3">
            <span className="text-xs text-slate-600">Min sq ft</span>
            <input value={t.min} onChange={(e) => update(i, { min: num(e.target.value) })} className="mt-1 w-full rounded-lg border px-2 py-1" />
          </label>
          <label className="col-span-3">
            <span className="text-xs text-slate-600">Max sq ft</span>
            <input value={t.max === Infinity ? 'Infinity' : t.max} onChange={(e) => update(i, { max: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1" />
          </label>
          <label className="col-span-3">
            <span className="text-xs text-slate-600">Rate $/sq ft</span>
            <input value={t.rate} onChange={(e) => update(i, { rate: num(e.target.value) })} className="mt-1 w-full rounded-lg border px-2 py-1" />
          </label>
          <label className="col-span-3">
            <span className="text-xs text-slate-600">Tier label</span>
            <input value={t.label} onChange={(e) => update(i, { label: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1" />
          </label>
          <div className="col-span-12 flex justify-end gap-2">
            <button onClick={() => remove(i)} className="text-rose-600 text-sm hover:underline">Remove</button>
          </div>
        </div>
      ))}
      <div className="pt-2">
        <button onClick={add} className="rounded-xl bg-white px-3 py-2 text-sm shadow hover:shadow-md border">+ Add Tier</button>
      </div>
    </div>
  )
}

function buildEmailHtml({ projectName, clientFirstName, serviceAddress, totalSqft, ceramic, solar }) {
  const ceramicDiscountLine =
    ceramic.mode === 'shop-min'
      ? `- <strong>Tier:</strong> ${escapeHtml(ceramic.tierLabel)}`
      : `- <strong>Discount tier applied:</strong> ${escapeHtml(ceramic.tierLabel)} (${ceramic.tierPct}%)`

  const solarDiscountLine =
    solar.mode === 'shop-min'
      ? `- <strong>Tier:</strong> ${escapeHtml(solar.tierLabel)}`
      : `- <strong>Discount tier applied:</strong> ${escapeHtml(solar.tierLabel)} (${solar.tierPct}%)`

  return `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color:#333; line-height:1.6; max-width:700px;">
    <p><strong>Subject:</strong> Your Window Film Proposal — ${escapeHtml(projectName)}</p>
    <p>${escapeHtml(clientFirstName)},</p>
    <p>Thank you for the opportunity to support ${escapeHtml(serviceAddress)}. Based on the verified measurements, please find two aligned options so you can select the performance profile and budget that best fit your goals.</p>
    <p><strong>Total Glass Area</strong><br>- <strong>${totalSqft.toFixed(2)} sq ft</strong></p>

    <div style="background:#f8f8f8; padding:16px; border-left:4px solid #0d6efd; margin:20px 0;">
      <h2>🌟 Option A — Premium Ceramic Window Film (TSER 69%+)</h2>
      <em>Our most advanced and most popular choice, combining performance and long-term value.</em>
      <p>Engineered to materially reduce solar heat gain and glare while maintaining optical clarity. This film delivers a <strong>Total Solar Energy Rejection of 69%+</strong>, helps stabilize interior temperatures, supports HVAC efficiency, and <strong>enhances the glass to elevate the exterior aesthetic.</strong></p>
      <p>- <strong>Original price:</strong> ${money(ceramic.original)}<br>
         ${ceramicDiscountLine}<br>
         - <strong>Your price:</strong> <strong>${money(ceramic.finalPrice)}</strong><br>
         - <strong>You save:</strong> ${money(ceramic.savings)}</p>
      <p><strong>Warranty</strong><br>
         - Residential: Lifetime warranty on film and workmanship<br>
         - Commercial: 12-year warranty on film and workmanship</p>
    </div>

    <div style="background:#f8f8f8; padding:16px; border-left:4px solid #444; margin:20px 0;">
      <h2>Option B — Solar Control Film (Budget-Friendly)</h2>
      <p>A cost-optimized solution that reduces heat and glare compared to untreated glass, offering a clean, neutral appearance. While designed for value, it is still installed to the same professional standards, ensuring durability and customer satisfaction.</p>
      <p>- <strong>Original price:</strong> ${money(solar.original)}<br>
         ${solarDiscountLine}<br>
         - <strong>Your price:</strong> <strong>${money(solar.finalPrice)}</strong><br>
         - <strong>You save:</strong> ${money(solar.savings)}</p>
      <p><strong>Warranty</strong><br>
         This film comes with <strong>limited coverage supported by our professional installation team</strong>, giving you added peace of mind knowing that you’re in good hands.</p>
    </div>

    <h2>Why Choose Us</h2>
    <p>We are <strong>Veteran owned and operated</strong> and consistently recognized as a <strong>5-star rated provider</strong>, trusted by homeowners and businesses alike. Our team is committed to delivering a seamless experience and results that elevate comfort, performance, and aesthetic appeal.</p>
    <p>Best regards,</p>
  </body></html>`
}

function num(v, fallback = 0) {
  const n = parseFloat(String(v).replace(/[^0-9.\\-]/g, ''))
  return isNaN(n) ? fallback : n
}
function money(n) {
  if (isNaN(n)) return '$0.00'
  return `$${n.toFixed(2)}`
}
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\"', '&quot;')
    .replaceAll(\"'\", '&#39;')
}
