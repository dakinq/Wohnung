import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useWohnungen, useBuchungen } from '../hooks/useFirestore'
import { MONATE, EINNAHMEN_KATEGORIEN, AUSGABEN_KATEGORIEN } from '../utils/constants'

const AKTUELLES_JAHR = new Date().getFullYear()
const AKTUELLER_MONAT = new Date().getMonth()

export default function Dashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { wohnungen } = useWohnungen()
  const { buchungen, loading } = useBuchungen(id)
  const [jahr, setJahr] = useState(AKTUELLES_JAHR)
  const [ansicht, setAnsicht] = useState('monat') // monat | jahr

  const wohnung = wohnungen.find(w => w.id === id)
  const sym = wohnung?.waehrung === 'CHF' ? 'CHF ' : '€'

  const fmt = (n) => `${sym}${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Jahres-Summen
  const jahresBuchungen = useMemo(() =>
    buchungen.filter(b => b.datum?.startsWith(String(jahr))),
    [buchungen, jahr]
  )

  const sumEin = jahresBuchungen.filter(b => b.typ === 'einnahme').reduce((a, b) => a + (b.betrag || 0), 0)
  const sumAus = jahresBuchungen.filter(b => b.typ === 'ausgabe').reduce((a, b) => a + (b.betrag || 0), 0)
  const saldo = sumEin - sumAus

  // Monatliche Chartdaten
  const chartDaten = useMemo(() => {
    return MONATE.map((monat, idx) => {
      const mStr = `${jahr}-${String(idx + 1).padStart(2, '0')}`
      const ein = buchungen.filter(b => b.typ === 'einnahme' && b.datum?.startsWith(mStr)).reduce((a, b) => a + (b.betrag || 0), 0)
      const aus = buchungen.filter(b => b.typ === 'ausgabe' && b.datum?.startsWith(mStr)).reduce((a, b) => a + (b.betrag || 0), 0)
      return { monat: monat.substring(0, 3), ein, aus }
    })
  }, [buchungen, jahr])

  // Kategorien-Aufschlüsselung
  const topAusgaben = useMemo(() => {
    const map = {}
    jahresBuchungen.filter(b => b.typ === 'ausgabe').forEach(b => {
      map[b.kategorie] = (map[b.kategorie] || 0) + (b.betrag || 0)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kat, sum]) => ({
        label: [...AUSGABEN_KATEGORIEN, ...EINNAHMEN_KATEGORIEN].find(k => k.id === kat)?.label || kat,
        summe: sum
      }))
  }, [jahresBuchungen])

  // Letzte 5 Buchungen
  const letzteBuchungen = buchungen.slice(0, 5)

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/')}>‹ Zurück</button>
          <h1>{wohnung?.adresse || 'Dashboard'}</h1>
        </div>
        <select className="year-select" value={jahr} onChange={e => setJahr(Number(e.target.value))}>
          {[AKTUELLES_JAHR + 1, AKTUELLES_JAHR, AKTUELLES_JAHR - 1, AKTUELLES_JAHR - 2].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </header>

      {/* KPI Cards */}
      <div className="kpi-row">
        <div className="kpi-card kpi-ein">
          <div className="kpi-label">Einnahmen {jahr}</div>
          <div className="kpi-value">{fmt(sumEin)}</div>
        </div>
        <div className="kpi-card kpi-aus">
          <div className="kpi-label">Ausgaben {jahr}</div>
          <div className="kpi-value">{fmt(sumAus)}</div>
        </div>
        <div className={`kpi-card ${saldo >= 0 ? 'kpi-pos' : 'kpi-neg'}`}>
          <div className="kpi-label">Saldo {jahr}</div>
          <div className="kpi-value">{fmt(saldo)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h3>Einnahmen & Ausgaben {jahr}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartDaten} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="monat" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={50} tickFormatter={v => `${sym}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip formatter={(v) => fmt(v)} labelFormatter={(l) => `Monat: ${l}`} />
            <Bar dataKey="ein" name="Einnahmen" fill="#3d8b6e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="aus" name="Ausgaben" fill="#c0392b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Ausgaben */}
      {topAusgaben.length > 0 && (
        <div className="card">
          <h3>Top Ausgaben {jahr}</h3>
          <div className="top-list">
            {topAusgaben.map((item, i) => (
              <div key={i} className="top-item">
                <span className="top-label">{item.label}</span>
                <div className="top-bar-wrap">
                  <div className="top-bar" style={{ width: `${(item.summe / topAusgaben[0].summe) * 100}%` }} />
                </div>
                <span className="top-value">{fmt(item.summe)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Letzte Buchungen */}
      <div className="card">
        <div className="card-header">
          <h3>Letzte Buchungen</h3>
          <button className="btn-link" onClick={() => navigate(`/wohnung/${id}/buchungen`)}>Alle anzeigen ›</button>
        </div>
        {letzteBuchungen.length === 0 ? (
          <p className="empty-state">Noch keine Buchungen. <button className="btn-link" onClick={() => navigate(`/wohnung/${id}/buchungen`)}>Jetzt erfassen ›</button></p>
        ) : (
          <div className="buchungen-list">
            {letzteBuchungen.map(b => (
              <div key={b.id} className="buchung-row">
                <div className="buchung-left">
                  <span className={`typ-dot ${b.typ}`} />
                  <div>
                    <div className="buchung-notiz">{b.notiz || b.kategorieLabel || b.kategorie}</div>
                    <div className="buchung-datum">{b.datum}</div>
                  </div>
                </div>
                <span className={`buchung-betrag ${b.typ}`}>
                  {b.typ === 'einnahme' ? '+' : '-'}{fmt(b.betrag)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nav Buttons */}
      <div className="bottom-nav">
        <button className="nav-btn active" onClick={() => navigate(`/wohnung/${id}`)}>📊 Dashboard</button>
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}/buchungen`)}>📋 Buchungen</button>
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}/nebenkosten`)}>💧 Nebenkosten</button>
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}/export`)}>📄 Export</button>
      </div>
    </div>
  )
}
