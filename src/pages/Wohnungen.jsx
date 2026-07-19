import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useWohnungen } from '../hooks/useFirestore'
import { WAEHRUNGEN } from '../utils/constants'

export default function Wohnungen() {
  const navigate = useNavigate()
  const { wohnungen, loading, addWohnung, deleteWohnung } = useWohnungen()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ adresse: '', waehrung: 'EUR', wohnflaeche: '', vermieterName: '', vermieterAdresse: '' })
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    await addWohnung(form)
    setForm({ adresse: '', waehrung: 'EUR', wohnflaeche: '', vermieterName: '', vermieterAdresse: '' })
    setShowForm(false)
    setSaving(false)
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Meine Wohnungen</h1>
          <p className="header-sub">Wähle eine Wohnung zum Verwalten</p>
        </div>
        <button className="btn-ghost" onClick={() => signOut(auth)}>Abmelden</button>
      </header>

      <div className="wohnungen-grid">
        {wohnungen.map(w => (
          <div key={w.id} className="wohnung-card" onClick={() => navigate(`/wohnung/${w.id}`)}>
            <div className="wohnung-icon">🏠</div>
            <div className="wohnung-info">
              <strong>{w.adresse}</strong>
              <span className="badge">{w.waehrung}</span>
              {w.wohnflaeche && <small>{w.wohnflaeche} m²</small>}
            </div>
            <div className="arrow">›</div>
          </div>
        ))}

        <button className="wohnung-add-btn" onClick={() => setShowForm(true)}>
          <span>+</span>
          <span>Wohnung hinzufügen</span>
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Neue Wohnung</h2>
            <form onSubmit={handleAdd}>
              <div className="field">
                <label>Adresse *</label>
                <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} placeholder="Musterstr. 1, 70173 Stuttgart" required />
              </div>
              <div className="field">
                <label>Währung *</label>
                <select value={form.waehrung} onChange={e => setForm({ ...form, waehrung: e.target.value })}>
                  {WAEHRUNGEN.map(w => <option key={w.code} value={w.code}>{w.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Wohnfläche (m²)</label>
                <input type="number" value={form.wohnflaeche} onChange={e => setForm({ ...form, wohnflaeche: e.target.value })} placeholder="75" />
              </div>
              <div className="field">
                <label>Dein Name (Vermieter)</label>
                <input value={form.vermieterName} onChange={e => setForm({ ...form, vermieterName: e.target.value })} placeholder="Max Mustermann" />
              </div>
              <div className="field">
                <label>Deine Adresse (Vermieter)</label>
                <input value={form.vermieterAdresse} onChange={e => setForm({ ...form, vermieterAdresse: e.target.value })} placeholder="Hauptstr. 10, 8001 Zürich" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Abbrechen</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? '…' : 'Speichern'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
