import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'Kein Konto mit dieser E-Mail gefunden.',
        'auth/wrong-password': 'Falsches Passwort.',
        'auth/email-already-in-use': 'E-Mail bereits registriert.',
        'auth/weak-password': 'Passwort muss mindestens 6 Zeichen haben.',
        'auth/invalid-email': 'Ungültige E-Mail-Adresse.',
        'auth/invalid-credential': 'E-Mail oder Passwort falsch.',
      }
      setError(msgs[err.code] || 'Fehler: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🏠</div>
        <h1 className="login-title">Mietwohnungs-Tracker</h1>
        <p className="login-sub">Einnahmen & Ausgaben im Griff</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '…' : isRegister ? 'Konto erstellen' : 'Anmelden'}
          </button>
        </form>

        <button className="login-switch" onClick={() => { setIsRegister(!isRegister); setError('') }}>
          {isRegister ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
        </button>
      </div>
    </div>
  )
}
