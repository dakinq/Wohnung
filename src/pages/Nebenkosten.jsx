import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWohnungen, useBuchungen, useMieter } from '../hooks/useFirestore'
import { AUSGABEN_KATEGORIEN } from '../utils/constants'
import { exportNebenkostenPDF } from '../utils/pdfExport'

const AKTUELLES_JAHR = new Date().getFullYear()

export default function Nebenkosten() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { wohnungen } = useWohnungen()
  const { buchungen } = useBuchungen(id)
  const { mieter, saveMieter } = useMieter(id)

  const wohnung = wohnungen.find(w => w.id === id)
  const sym = wohnung?.waehrung === 'CHF' ? 'CHF ' : '€'
  const fmt = (n) => `${sym}${Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [jahr, setJahr] = useState(AKTUELLES_JAHR - 1)
  const [showMieterForm, setShowMieterForm] = useState(false)
  const [mieterForm, setMieterForm] = useState({ name: '', einzug: '', vorauszahlung: '' })
  const [savingMieter, setSavingMieter] = useState(false)
  const [generating, setGenerating] = useState(false)

  const jahrBuchungen = useMemo(() =>
    buchungen.filter(b => b.datum?.startsWith(String(jahr))),
    [buchungen, jahr]
  )

  // Umlagefähige BetrKV-Kosten
  const betrKVKosten = useMemo(() => {
    return AUSGABEN_KATEGORIEN.filter(k => k.betrKV).map(kat => {
      const summe = jahrBuchungen
        .filter(b => b.typ === 'ausgabe' && b.kategorie === kat.id)
        .reduce((a, b) => a + (b.betrag || 0), 0)
      return { ...kat, summe }
    }).filter(k => k.summe > 0)
  }, [jahrBuchungen])

  const gesamtKosten = betrKVKosten.reduce((a, k) => a + k.summe, 0)

  // Vorauszahlungen aus Buchungen
  const vorauszahlungenAusBuchungen = jahrBuchungen
    .filter(b => b.typ === 'einnahme' && b.kategorie === 'nebenkosten_vz')
    .reduce((a, b) => a + (b.betrag || 0), 0)

  // Monatliche VZ aus Mieterdaten
  const monatlicheVZ = mieter?.vorauszahlung ? Number(mieter.vorauszahlung) : 0
  const jahreszahlung = monatlicheVZ * 12

  const effektiveVZ = vorauszahlungenAusBuchungen > 0 ? vorauszahlungenAusBuchungen : jahreszahlung
  const saldo = effektiveVZ - gesamtKosten

  const handleSaveMieter = async (e) => {
    e.preventDefault()
    setSavingMieter(true)
    await saveMieter(mieterForm)
    setShowMieterForm(false)
    setSavingMieter(false)
  }

  const handlePDF = async () => {
    if (!wohnung) return
    setGenerating(true)
    try {
      exportNebenkostenPDF({
        wohnung,
        mieter,
        buchungen,
        jahr,
        vorauszahlungen: effektiveVZ
      })
    } catch (e) {
      console.error(e)
    }
    setGenerating(false)
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate(`/wohnung/${id}`)}>‹ Dashboard</button>
          <h1>Nebenkostenabrechnung</h1>
        </div>
        <select className="year-select" value={jahr} onChange={e => setJahr(Number(e.target.value))}>
          {[AKTUELLES_JAHR, AKTUELLES_JAHR - 1, AKTUELLES_JAHR - 2, AKTUELLES_JAHR - 3].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </header>

      {/* Mieter */}
      <div className="card">
        <div className="card-header">
          <h3>👤 Mieterdaten</h3>
          <button className="btn-link" onClick={() => { setMieterForm({ name: mieter?.name || '', einzug: mieter?.einzug || '', vorauszahlung: mieter?.vorauszahlung || '' }); setShowMieterForm(true) }}>
            {mieter ? 'Bearbeiten' : '+ Hinzufügen'}
          </button>
        </div>
        {mieter ? (
          <div className="mieter-info">
            <div><strong>Name:</strong> {mieter.name}</div>
            {mieter.einzug && <div><strong>Einzug:</strong> {mieter.einzug}</div>}
            {mieter.vorauszahlung && <div><strong>Monatl. Vorauszahlung:</strong> {fmt(mieter.vorauszahlung)}</div>}
          </div>
        ) : (
          <p className="empty-state">Keine Mieterdaten hinterlegt.</p>
        )}
      </div>

      {/* BetrKV Kosten */}
      <div className="card">
        <h3>📋 Umlagefähige Kosten {jahr}</h3>
        <p className="card-sub">Gemäß § 2 BetrKV — basierend auf deinen Buchungen</p>

        {betrKVKosten.length === 0 ? (
          <p className="empty-state">Noch keine umlagefähigen Ausgaben im Jahr {jahr} erfasst. <button className="btn-link" onClick={() => navigate(`/wohnung/${id}/buchungen`)}>Buchungen erfassen ›</button></p>
        ) : (
          <div className="nk-tabelle">
            {betrKVKosten.map(k => (
              <div key={k.id} className="nk-row">
                <span className="nk-icon">{k.icon}</span>
                <span className="nk-label">{k.label}</span>
                <span className="nk-betrag">{fmt(k.summe)}</span>
              </div>
            ))}
            <div className="nk-total">
              <span>Gesamtkosten</span>
              <span>{fmt(gesamtKosten)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Abrechnung */}
      <div className="card">
        <h3>⚖️ Abrechnung {jahr}</h3>
        <div className="abrechnung-box">
          <div className="abr-row">
            <span>Gesamtkosten</span>
            <span>{fmt(gesamtKosten)}</span>
          </div>
          <div className="abr-row">
            <span>
              Vorauszahlungen
              {vorauszahlungenAusBuchungen > 0
                ? ' (aus Buchungen)'
                : mieter?.vorauszahlung ? ` (${fmt(monatlicheVZ)} × 12 Monate)` : ''}
            </span>
            <span>{fmt(effektiveVZ)}</span>
          </div>
          <div className={`abr-row abr-saldo ${saldo >= 0 ? 'positiv' : 'negativ'}`}>
            <strong>{saldo >= 0 ? '✓ Guthaben Mieter' : '⚠ Nachzahlung Mieter'}</strong>
            <strong>{fmt(Math.abs(saldo))}</strong>
          </div>
        </div>
      </div>

      {/* PDF Export */}
      <div className="card">
        <h3>📄 PDF erstellen</h3>
        <p className="card-sub">Professionelle Abrechnung zum Versand an den Mieter</p>
        <button
          className="btn-primary btn-full"
          onClick={handlePDF}
          disabled={generating || betrKVKosten.length === 0}
        >
          {generating ? 'PDF wird erstellt…' : `Nebenkostenabrechnung ${jahr} als PDF`}
        </button>
        {betrKVKosten.length === 0 && (
          <p className="hint">⚠ Erfasse zuerst umlagefähige Ausgaben im Bereich Buchungen.</p>
        )}
      </div>

      {/* Mieter Form */}
      {showMieterForm && (
        <div className="modal-overlay" onClick={() => setShowMieterForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Mieterdaten</h2>
            <form onSubmit={handleSaveMieter}>
              <div className="field">
                <label>Name Mieter *</label>
                <input value={mieterForm.name} onChange={e => setMieterForm({ ...mieterForm, name: e.target.value })} placeholder="Max Mustermann" required />
              </div>
              <div className="field">
                <label>Einzugsdatum</label>
                <input type="date" value={mieterForm.einzug} onChange={e => setMieterForm({ ...mieterForm, einzug: e.target.value })} />
              </div>
              <div className="field">
                <label>Monatliche Nebenkostenvorauszahlung ({wohnung?.waehrung})</label>
                <input type="number" step="0.01" value={mieterForm.vorauszahlung} onChange={e => setMieterForm({ ...mieterForm, vorauszahlung: e.target.value })} placeholder="150.00" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowMieterForm(false)}>Abbrechen</button>
                <button type="submit" className="btn-primary" disabled={savingMieter}>{savingMieter ? '…' : 'Speichern'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}`)}>📊 Dashboard</button>
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}/buchungen`)}>📋 Buchungen</button>
        <button className="nav-btn active" onClick={() => navigate(`/wohnung/${id}/nebenkosten`)}>💧 Nebenkosten</button>
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}/export`)}>📄 Export</button>
      </div>
    </div>
  )
}
