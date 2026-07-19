import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, where, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

// ── Wohnungen ──────────────────────────────────────────────
export function useWohnungen() {
  const { user } = useAuth()
  const [wohnungen, setWohnungen] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'wohnungen'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setWohnungen(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user])

  const addWohnung = async (data) => {
    await addDoc(collection(db, 'wohnungen'), {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp()
    })
  }

  const updateWohnung = async (id, data) => {
    await updateDoc(doc(db, 'wohnungen', id), data)
  }

  const deleteWohnung = async (id) => {
    await deleteDoc(doc(db, 'wohnungen', id))
  }

  return { wohnungen, loading, addWohnung, updateWohnung, deleteWohnung }
}

// ── Buchungen ──────────────────────────────────────────────
export function useBuchungen(wohnungId) {
  const { user } = useAuth()
  const [buchungen, setBuchungen] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !wohnungId) return
    const q = query(
      collection(db, 'buchungen'),
      where('userId', '==', user.uid),
      where('wohnungId', '==', wohnungId),
      orderBy('datum', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setBuchungen(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user, wohnungId])

  const addBuchung = async (data) => {
    await addDoc(collection(db, 'buchungen'), {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp()
    })
  }

  const updateBuchung = async (id, data) => {
    await updateDoc(doc(db, 'buchungen', id), data)
  }

  const deleteBuchung = async (id) => {
    await deleteDoc(doc(db, 'buchungen', id))
  }

  return { buchungen, loading, addBuchung, updateBuchung, deleteBuchung }
}

// ── Mieter ─────────────────────────────────────────────────
export function useMieter(wohnungId) {
  const { user } = useAuth()
  const [mieter, setMieter] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !wohnungId) return
    const q = query(
      collection(db, 'mieter'),
      where('userId', '==', user.uid),
      where('wohnungId', '==', wohnungId)
    )
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setMieter({ id: snap.docs[0].id, ...snap.docs[0].data() })
      } else {
        setMieter(null)
      }
      setLoading(false)
    })
    return unsub
  }, [user, wohnungId])

  const saveMieter = async (data) => {
    if (mieter) {
      await updateDoc(doc(db, 'mieter', mieter.id), data)
    } else {
      await addDoc(collection(db, 'mieter'), {
        ...data,
        userId: user.uid,
        wohnungId,
        createdAt: serverTimestamp()
      })
    }
  }

  return { mieter, loading, saveMieter }
}
