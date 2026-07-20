import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Einstellungen() {
  const { user } = useAuth();

  return (
    <div className="page pt-4">
      <h1>Einstellungen</h1>

      <div className="card mt-3" style={{ padding: '1rem 1.25rem' }}>
        <p className="text-sm text-muted">Angemeldet als</p>
        <p style={{ fontWeight: 500, marginTop: '0.25rem' }}>{user?.email}</p>
      </div>

      <button
        className="btn btn-secondary mt-2"
        onClick={() => signOut(auth)}
      >
        Abmelden
      </button>

      <p className="text-muted mt-3" style={{ fontSize: '0.8125rem', textAlign: 'center' }}>
        Wechselkurs und weitere Einstellungen kommen in Phase 3.
      </p>
    </div>
  );
}
