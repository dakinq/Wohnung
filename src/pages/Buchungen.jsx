import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWohnungen, useBuchungen } from '../hooks/useFirestore'
import { EINNAHMEN_KATEGORIEN, AUSGABEN_KATEGORIEN, MONATE } from '../utils/constants'

const AKTUELLES_JAHR = new Date().getFullYear()

export default function Buchungen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { wohnungen } = useWohnungen()
  const { buchungen, loading, addBuchung, deleteBuchung } = useBuchungen(id)

  const wohnung = wohnungen.find(w => w.id === id)
  const sym = wohnung?.waehrung === 'CHF' ? 'CHF ' : '€'
  const fmt = (n) => `${sym}${Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('alle') // alle | einnahme | ausgabe
  const [filterJahr, setFilterJahr] = useState(AKTUELLES_JAHR)
  const [filterMonat, setFilterMonat] = useState('alle')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [form, setForm] = useState({
    typ: 'einnahme',
    datum: new Date().toISOString().split('T')[0],
    betrag: '',
    kategorie: 'miete',
    notiz: ''
  })
  const [saving, setSaving] = useState(false)

  const kategorien = form.typ === 'einnahme' ? EINNAHMEN_KATEGORIEN : AUSGABEN_KATEGORIEN

  const handleTypChange = (typ) => {
    const defaultKat = typ === 'einnahme' ? 'miete' : 'grundsteuer'
    setForm({ ...form, typ, kategorie: defaultKat })
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    const kat = kategorien.find(k => k.id === form.kategorie)
    await addBuchung({
      ...form,
      betrag: parseFloat(form.betrag),
      kategorieLabel: kat?.label || form.kategorie
    })
    setForm({ ...form, betrag: '', notiz: '' })
    setShowForm(false)
    setSaving(false)
  }

  const gefiltert = useMemo(() => {
    return buchungen.filter(b => {
      if (filter !== 'alle' && b.typ !== filter) return false
      if (!b.datum?.startsWith(String(filterJahr))) return false
      if (filterMonat !== 'alle') {
        const m = String(Number(filterMonat)).padStart(2, '0')
        if (!b.datum?.startsWith(`${filterJahr}-${m}`)) return false
      }
      return true
    })
  }, [buchungen, filter, filterJahr, filterMonat])

  const sumEin = gefiltert.filter(b => b.typ === 'einnahme').reduce((a, b) => a + (b.betrag || 0), 0)
  const sumAus = gefiltert.filter(b => b.typ === 'ausgabe').reduce((a, b) => a + (b.betrag || 0), 0)

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate(`/wohnung/${id}`)}>‹ Dashboard</button>
          <h1>Buchungen</h1>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Neu</button>
      </header>

      {/* Filter */}
      <div className="filter-row">
        <div className="seg-ctrl">
          {['alle', 'einnahme', 'ausgabe'].map(t => (
            <button key={t} className={`seg-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
              {t === 'alle' ? 'Alle' : t === 'einnahme' ? 'Einnahmen' : 'Ausgaben'}
            </button>
          ))}
        </div>
        <div className="filter-selects">
          <select value={filterJahr} onChange={e => setFilterJahr(Number(e.target.value))}>
            {[AKTUELLES_JAHR + 1, AKTUELLES_JAHR, AKTUELLES_JAHR - 1, AKTUELLES_JAHR - 2].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select value={filterMonat} onChange={e => setFilterMonat(e.target.value)}>
            <option value="alle">Alle Monate</option>
            {MONATE.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Mini-Saldo */}
      <div className="mini-saldo">
        <span className="ein-sum">+ {fmt(sumEin)}</span>
        <span className="divider">|</span>
        <span className="aus-sum">- {fmt(sumAus)}</span>
        <span className="divider">|</span>
        <span className={`saldo-sum ${sumEin - sumAus >= 0 ? 'pos' : 'neg'}`}>{fmt(sumEin - sumAus)}</span>
      </div>

      {/* Liste */}
      <div className="buchungen-full-list">
        {gefiltert.length === 0 ? (
          <div className="empty-state-big">
            <div>📋</div>
            <p>Keine Buchungen gefunden</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>Erste Buchung erfassen</button>
          </div>
        ) : (
          gefiltert.map(b => (
            <div key={b.id} className="buchung-item">
              <div className={`buchung-typ-bar ${b.typ}`} />
              <div className="buchung-content">
                <div className="buchung-main">
                  <span className="buchung-kat">{b.kategorieLabel || b.kategorie}</span>
                  <span className={`buchung-betrag-lg ${b.typ}`}>
                    {b.typ === 'einnahme' ? '+' : '-'}{fmt(b.betrag)}
                  </span>
                </div>
                {b.notiz && <div className="buchung-notiz-text">{b.notiz}</div>}
                <div className="buchung-meta">
                  <span>{b.datum}</span>
                  <button className="delete-btn" onClick={() => setDeleteConfirm(b.id)}>🗑</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <h3>Buchung löschen?</h3>
            <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
              <button className="btn-danger" onClick={async () => { await deleteBuchung(deleteConfirm); setDeleteConfirm(null) }}>Löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Neue Buchung</h2>
            <form onSubmit={handleAdd}>
              <div className="seg-ctrl mb">
                <button type="button" className={`seg-btn ${form.typ === 'einnahme' ? 'active' : ''}`} onClick={() => handleTypChange('einnahme')}>Einnahme</button>
                <button type="button" className={`seg-btn ${form.typ === 'ausgabe' ? 'active' : ''}`} onClick={() => handleTypChange('ausgabe')}>Ausgabe</button>
              </div>

              <div className="field">
                <label>Datum *</label>
                <input type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })} required />
              </div>
              <div className="field">
                <label>Betrag ({wohnung?.waehrung || 'EUR'}) *</label>
                <input type="number" step="0.01" min="0" value={form.betrag} onChange={e => setForm({ ...form, betrag: e.target.value })} placeholder="0.00" required />
              </div>
              <div className="field">
                <label>Kategorie *</label>
                <select value={form.kategorie} onChange={e => setForm({ ...form, kategorie: e.target.value })}>
                  {kategorien.map(k => <option key={k.id} value={k.id}>{k.icon} {k.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Notiz</label>
                <input value={form.notiz} onChange={e => setForm({ ...form, notiz: e.target.value })} placeholder="z.B. Januarmiete 2025" />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Abbrechen</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? '…' : 'Speichern'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}`)}>📊 Dashboard</button>
        <button className="nav-btn active" onClick={() => navigate(`/wohnung/${id}/buchungen`)}>📋 Buchungen</button>
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}/nebenkosten`)}>💧 Nebenkosten</button>
        <button className="nav-btn" onClick={() => navigate(`/wohnung/${id}/export`)}>📄 Export</button>
      </div>
    </div>
  )
}
