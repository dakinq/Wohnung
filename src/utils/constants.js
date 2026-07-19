export const EINNAHMEN_KATEGORIEN = [
  { id: 'miete', label: 'Kaltmiete', icon: '🏠' },
  { id: 'nebenkosten_vz', label: 'Nebenkostenvorauszahlung', icon: '💧' },
  { id: 'kaution', label: 'Kaution', icon: '🔐' },
  { id: 'nachzahlung', label: 'Nachzahlung Mieter', icon: '↩️' },
  { id: 'sonstiges_ein', label: 'Sonstiges', icon: '📋' },
]

export const AUSGABEN_KATEGORIEN = [
  { id: 'grundsteuer', label: 'Grundsteuer', icon: '🏛️', betrKV: true, betrKVNr: 1 },
  { id: 'wasser', label: 'Wasser & Abwasser', icon: '💧', betrKV: true, betrKVNr: 2 },
  { id: 'heizung', label: 'Heizung', icon: '🔥', betrKV: true, betrKVNr: 4, warm: true },
  { id: 'warmwasser', label: 'Warmwasser', icon: '♨️', betrKV: true, betrKVNr: 5, warm: true },
  { id: 'aufzug', label: 'Fahrstuhl / Aufzug', icon: '🛗', betrKV: true, betrKVNr: 7 },
  { id: 'muell', label: 'Müllabfuhr', icon: '🗑️', betrKV: true, betrKVNr: 8 },
  { id: 'strassenreinigung', label: 'Straßenreinigung', icon: '🧹', betrKV: true, betrKVNr: 8 },
  { id: 'gebaeudereinigung', label: 'Gebäudereinigung', icon: '🧽', betrKV: true, betrKVNr: 9 },
  { id: 'gartenpflege', label: 'Gartenpflege', icon: '🌿', betrKV: true, betrKVNr: 10 },
  { id: 'allgemeinstrom', label: 'Allgemeinstrom', icon: '💡', betrKV: true, betrKVNr: 11 },
  { id: 'schornstein', label: 'Schornsteinreinigung', icon: '🏗️', betrKV: true, betrKVNr: 12 },
  { id: 'versicherung', label: 'Sach- & Haftpflichtversicherung', icon: '🛡️', betrKV: true, betrKVNr: 13 },
  { id: 'hauswart', label: 'Hauswart', icon: '👷', betrKV: true, betrKVNr: 14 },
  { id: 'kabel', label: 'Kabelgebühren / Internet', icon: '📡', betrKV: true, betrKVNr: 15 },
  { id: 'waeschepflege', label: 'Wäschepflege', icon: '👕', betrKV: true, betrKVNr: 16 },
  { id: 'sonstige_betrKV', label: 'Sonstige Betriebskosten (BetrKV)', icon: '📦', betrKV: true, betrKVNr: 17 },
  { id: 'reparatur', label: 'Reparaturen', icon: '🔧', betrKV: false },
  { id: 'verwaltung', label: 'Verwaltungskosten', icon: '📁', betrKV: false },
  { id: 'hypothek', label: 'Hypothek / Zinsen', icon: '🏦', betrKV: false },
  { id: 'steuer', label: 'Steuern', icon: '📊', betrKV: false },
  { id: 'sonstiges_aus', label: 'Sonstiges', icon: '📋', betrKV: false },
]

export const WAEHRUNGEN = [
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'CHF', symbol: 'CHF', label: 'Schweizer Franken (CHF)' },
]

export const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

export const STEUER_LAENDER = [
  { id: 'de_bw', label: 'Deutschland – Baden-Württemberg', waehrung: 'EUR' },
  { id: 'ch', label: 'Schweiz', waehrung: 'CHF' },
]
