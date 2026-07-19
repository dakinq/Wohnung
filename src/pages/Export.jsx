import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWohnungen, useBuchungen } from '../hooks/useFirestore'
import { STEUER_LAENDER, WAEHRUNGEN } from '../utils/constants'
import { exportSteuerPDF, exportCSV } from '../utils/pdfExport'

const AKTUELLES_JAHR = new Date().getFullYear()

export default function Export() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { wohnungen } = useWohnungen()
  const { buchungen } = useBuchungen(id)

  const wohnung = wohnungen.find(w => w.id === id)

  const [jahr, setJahr] = useState(AKTUELLES_JAHR - 1)
  const [land, setLand] = useState('de_bw')
  const [wechselkurs, setWechselkurs] = useState(1)
  const [zielWaehrung, setZielWaehrung] = useState('EUR')
  const [generating, setGenerating] = useState(false)

  const brauchtWechselkurs = wohnung?.waehrung && wohnung.waehrung !== zielWaehrung

  const handleSteuerPDF = async () => {
    setGenerating(true)
    try {
      exportSteuerPDF({ wohnung, buchungen, jahr, land, wechselkurs: brauchtWechselkurs ? wechselkurs : 1, zielWaehrung })
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const handleCSV = () => {
    exportCSV({ buchungen, jahr, wohnung })
  }

  const jahrBuchungen = buchungen.filter(b => b.datum?.startsWith(String(jahr)))
  const sumEin = jahrBuchungen.filter(b => b.typ === 'einnahme').reduce((a, b) => a + (b.betrag || 0), 0)
  const sumAus = jahrBuchungen.filter(b => b.typ === 'ausgabe').reduce((a, b) => a + (b.betrag || 0), 0)

  const sym = wohnung?.waehrung === 'CHF' ? 'CHF ' : '€'
  const fmt = (n) => `${sym}${Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate(`/wohnung/${id}`)}>‹ Dashboard</button>
          <h1>Export</h1>
        </div>
        <select className="year-select" value={jahr} onChange={e => setJahr(Number(e.target.value))}>
          {[AKTUELLES_JAHR, AKTUELLES_JAHR - 1, AKTUELLES_JAHR - 2, AKTUELLES_JAHR - 3].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </header>

      {/* Übersicht */}
      <div className="card">
        <h3>📊 Übersicht {jahr}</h3>
        <div className="export-overview">
          <div className="exp-stat">
            <span>Buchungen</span>
            <strong>{jahrBuchungen.length}</strong>
          </div>
          <div className="exp-stat">
            <span>Einnahmen</span>
            <strong className="ein">{fmt(sumEin)}</strong>
          </div>
          <div className="exp-stat">
            <span>Ausgaben</span>
            <strong className="aus">{fmt(sumAus)}</strong>
          </div>
          <div className="exp-stat">
            <span>Saldo</span>
            <strong className={sumEin - sumAus >= 0 ? 'ein' : 'aus'}>{fmt(sumEin - sumAus)}</strong>
          </div>
        </div>
      </div>

      {/* Steuerexport */}
      <div className="card">
        <h3>🧾 Steuererklärung PDF</h3>
        <p className="card-sub">Aufstellung aller Einnahmen & Ausgaben mit Steuerhinweisen</p>

        <div className="field">
          <label>Steuerpflicht in</label>
          <select value={land} onChange={e => setLand(e.target.value)}>
            {STEUER_LAENDER.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Ausgabe-Währung</label>
          <select value={zielWaehrung} onChange={e => setZielWaehrung(e.target.value)}>
            {WAEHRUNGEN.map(w => <option key={w.code} value={w.code}>{w.label}</option>)}
          </select>
        </div>

        {brauchtWechselkurs && (
          <div className="field">
            <label>Wechselkurs: 1 {wohnung?.waehrung} = ? {zielWaehrung}</label>
            <input
              type="number"
              step="0.0001"
              value={wechselkurs}
              onChange={e => setWechselkurs(parseFloat(e.target.value))}
              placeholder="z.B. 0.95"
            />
            <small className="field-hint">
              Jahresdurchschnittskurs empfohlen (z.B. ESTV für CH, Bundesbank für DE)
            </small>
          </div>
        )}

        <button className="btn-primary btn-full" onClick={handleSteuerPDF} disabled={generating || jahrBuchungen.length === 0}>
          {generating ? 'PDF wird erstellt…' : `Steuer-PDF ${jahr} erstellen`}
        </button>

        {jahrBuchungen.length === 0 && (
          <p className="hint">⚠ Keine Buchungen im Jahr {jahr} gefunden.</p>
        )}
      </div>

      {/* CSV Export */}
      <div className="card">
        <h3>📊 CSV Export</h3>
        <p className="card-sub">Alle Buchungen als CSV — öffenbar in Excel oder Numbers</p>
        <button className="btn-secondary btn-full" onClick={handleCSV} disabled={jahrBuchungen.length === 0}>
          CSV herunterladen ({jahrBuchungen.length} Buchungen)
        </button>
      </div>

      {/* Steuerhinweise */}
      <div className="card">
        <h3>💡 Steuerhinweise</h3>
        <div className="steuer-hint-box">
          <div className="hint-section">
            <strong>🇩🇪 Deutschland (Baden-Württemberg)</strong>
            <ul>
              <li>Anlage V – Vermietung & Verpachtung</li>
              <li>Mieteinnahmen sind steuerpflichtig</li>
              <li>Werbungskosten mindern das Einkommen</li>
              <li>AfA auf Gebäude prüfen (2% pro Jahr)</li>
            </ul>
          </div>
          <div className="hint-section">
            <strong>🇨🇭 Schweiz</strong>
            <ul>
              <li>Auslandsimmobilie in Steuererklärung deklarieren</li>
              <li>DBA DE–CH: Deutschland besteuert, CH rechnet an</li>
              <li>Liegenschaftsunterhalt: Pauschale oder effektiv</li>
              <li>Hypozinsen als Schuldzinsen abziehbar</li>
            </ul>
          </div>
        </div>
        <p className="disclaimer">⚠ Dies ist keine Steuerberatung. Bitte konsultiere einen Steuerberater.</p>
      </div>

      <div className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}`)}>📊 Dashboard</button>
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}/buchungen`)}>📋 Buchungen</button>
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}/nebenkosten`)}>💧 Nebenkosten</button>
        <button className="nav-btn active" onClick={() => navigate(`/wohnung/${id}/export`)}>📄 Export</button>
      </div>
    </div>
  )
}
