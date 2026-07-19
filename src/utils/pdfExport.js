import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AUSGABEN_KATEGORIEN, MONATE } from './constants'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const BRAND = { r: 26, g: 39, b: 68 }   // #1a2744
const ACCENT = { r: 91, g: 143, b: 185 } // #5b8fb9

function header(doc, title, subtitle) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, 14, 20)
  doc.setTextColor(0, 0, 0)
}

// ── Nebenkostenabrechnung PDF ──────────────────────────────
export function exportNebenkostenPDF({ wohnung, mieter, buchungen, jahr, vorauszahlungen }) {
  const doc = new jsPDF()

  header(doc, 'Nebenkostenabrechnung', `Abrechnungszeitraum: 01.01.${jahr} – 31.12.${jahr}`)

  let y = 36

  // Adressblock
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Vermieter', 14, y)
  doc.text('Mieter', 110, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const vermieterLines = [
    wohnung.vermieterName || '–',
    wohnung.vermieterAdresse || '–',
  ]
  const mieterLines = [
    mieter?.name || '–',
    wohnung.adresse || '–',
  ]

  vermieterLines.forEach((l, i) => doc.text(l, 14, y + 6 + i * 5))
  mieterLines.forEach((l, i) => doc.text(l, 110, y + 6 + i * 5))

  y += 26

  // Wohnfläche / Abrechnungsschlüssel
  doc.setFillColor(240, 244, 250)
  doc.rect(14, y, 182, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`Wohnfläche: ${wohnung.wohnflaeche || '–'} m²   |   Verteilerschlüssel: Wohnfläche`, 18, y + 6.5)
  doc.setFont('helvetica', 'normal')
  y += 16

  // Kostenaufstellung
  const betrKVBuchungen = buchungen.filter(b =>
    b.typ === 'ausgabe' &&
    b.datum?.startsWith(String(jahr))
  )

  const rows = []
  let gesamtKosten = 0

  AUSGABEN_KATEGORIEN.filter(k => k.betrKV).forEach(kat => {
    const summe = betrKVBuchungen
      .filter(b => b.kategorie === kat.id)
      .reduce((acc, b) => acc + (b.betrag || 0), 0)
    if (summe > 0) {
      rows.push([
        `§2 Nr. ${kat.betrKVNr} BetrKV`,
        kat.label,
        formatWaehrung(summe, wohnung.waehrung)
      ])
      gesamtKosten += summe
    }
  })

  autoTable(doc, {
    startY: y,
    head: [['Rechtsgrundlage', 'Kostenart', 'Betrag']],
    body: rows,
    foot: [['', 'Gesamtkosten', formatWaehrung(gesamtKosten, wohnung.waehrung)]],
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontSize: 9 },
    footStyles: { fillColor: [220, 230, 245], textColor: [BRAND.r, BRAND.g, BRAND.b], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: { 2: { halign: 'right' } }
  })

  y = doc.lastAutoTable.finalY + 10

  // Vorauszahlungen
  const gesamtVZ = vorauszahlungen || buchungen
    .filter(b => b.typ === 'einnahme' && b.kategorie === 'nebenkosten_vz' && b.datum?.startsWith(String(jahr)))
    .reduce((acc, b) => acc + (b.betrag || 0), 0)

  const saldo = gesamtVZ - gesamtKosten

  autoTable(doc, {
    startY: y,
    body: [
      ['Gesamtkosten Nebenkosten', formatWaehrung(gesamtKosten, wohnung.waehrung)],
      ['Geleistete Vorauszahlungen', formatWaehrung(gesamtVZ, wohnung.waehrung)],
      [saldo >= 0 ? '✓ Guthaben Mieter' : '⚠ Nachzahlung Mieter', formatWaehrung(Math.abs(saldo), wohnung.waehrung)],
    ],
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    bodyStyles: (row) => row.index === 2 ? { fillColor: saldo >= 0 ? [220, 245, 225] : [245, 225, 220] } : {}
  })

  y = doc.lastAutoTable.finalY + 16

  // Unterschriften
  doc.setDrawColor(180, 180, 180)
  doc.line(14, y, 80, y)
  doc.line(120, y, 196, y)
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Datum / Unterschrift Vermieter', 14, y + 5)
  doc.text('Datum / Unterschrift Mieter', 120, y + 5)

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(
      `Erstellt am ${format(new Date(), 'dd.MM.yyyy', { locale: de })} – Mietwohnungs-Tracker`,
      14, 290
    )
    doc.text(`Seite ${i} / ${pageCount}`, 180, 290)
  }

  doc.save(`Nebenkostenabrechnung_${jahr}_${(wohnung.adresse || 'Wohnung').replace(/\s/g, '_')}.pdf`)
}

// ── Steuerexport PDF ───────────────────────────────────────
export function exportSteuerPDF({ wohnung, buchungen, jahr, land, wechselkurs, zielWaehrung }) {
  const doc = new jsPDF()
  const landLabel = land === 'ch' ? 'Schweiz' : 'Deutschland – Baden-Württemberg'

  header(doc, `Steuerübersicht ${jahr}`, `${landLabel} | ${wohnung.adresse || 'Wohnung'}`)

  let y = 36

  const jahrBuchungen = buchungen.filter(b => b.datum?.startsWith(String(jahr)))

  const einnahmen = jahrBuchungen.filter(b => b.typ === 'einnahme')
  const ausgaben = jahrBuchungen.filter(b => b.typ === 'ausgabe')

  const konvert = (betrag) => {
    if (wohnung.waehrung === zielWaehrung) return betrag
    return betrag * (wechselkurs || 1)
  }

  const sumEin = einnahmen.reduce((a, b) => a + konvert(b.betrag || 0), 0)
  const sumAus = ausgaben.reduce((a, b) => a + konvert(b.betrag || 0), 0)
  const ueberschuss = sumEin - sumAus

  // Summary box
  doc.setFillColor(240, 244, 250)
  doc.rect(14, y, 182, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Zusammenfassung', 18, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Gesamteinnahmen: ${formatWaehrung(sumEin, zielWaehrung)}`, 18, y + 14)
  doc.text(`Gesamtausgaben: ${formatWaehrung(sumAus, zielWaehrung)}`, 90, y + 14)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(ueberschuss >= 0 ? 0 : 180, ueberschuss >= 0 ? 100 : 0, 0)
  doc.text(
    `Überschuss / Verlust: ${formatWaehrung(ueberschuss, zielWaehrung)}`,
    18, y + 20
  )
  doc.setTextColor(0, 0, 0)
  y += 30

  if (wohnung.waehrung !== zielWaehrung) {
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(`Wechselkurs: 1 ${wohnung.waehrung} = ${wechselkurs} ${zielWaehrung} (manuell definiert)`, 14, y)
    doc.setTextColor(0)
    y += 8
  }

  // Einnahmen Tabelle
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Einnahmen', 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Datum', 'Beschreibung', 'Kategorie', `Betrag (${zielWaehrung})`]],
    body: einnahmen.map(b => [
      b.datum || '–',
      b.notiz || '–',
      b.kategorieLabel || b.kategorie,
      formatWaehrung(konvert(b.betrag || 0), zielWaehrung)
    ]),
    foot: [['', '', 'Summe Einnahmen', formatWaehrung(sumEin, zielWaehrung)]],
    headStyles: { fillColor: [26, 120, 80], textColor: 255, fontSize: 8 },
    footStyles: { fillColor: [220, 245, 230], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: { 3: { halign: 'right' } }
  })

  y = doc.lastAutoTable.finalY + 10

  // Ausgaben Tabelle
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Ausgaben (Werbungskosten)', 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Datum', 'Beschreibung', 'Kategorie', `Betrag (${zielWaehrung})`]],
    body: ausgaben.map(b => [
      b.datum || '–',
      b.notiz || '–',
      b.kategorieLabel || b.kategorie,
      formatWaehrung(konvert(b.betrag || 0), zielWaehrung)
    ]),
    foot: [['', '', 'Summe Ausgaben', formatWaehrung(sumAus, zielWaehrung)]],
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontSize: 8 },
    footStyles: { fillColor: [220, 230, 245], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: { 3: { halign: 'right' } }
  })

  // Land-spezifische Hinweise
  const pageCount = doc.internal.getNumberOfPages()
  doc.addPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Hinweise für die Steuererklärung`, 14, 20)

  if (land === 'de_bw') {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const hinweise = [
      '• Anlage V (Einkünfte aus Vermietung und Verpachtung) ausfüllen',
      '• Einnahmen in Zeile 9 ff. eintragen (Miete + Nebenkosten)',
      '• Werbungskosten in Zeile 33 ff. (Zinsen, Abschreibung, Verwaltung etc.)',
      '• Ggf. lineare AfA (Abschreibung) auf Anschaffungskosten prüfen',
      '• Baden-Württemberg: Grundsteuer B beachten',
      '• Bei ausländischen Einkünften: Anlage AUS prüfen (DBA CH-DE)',
    ]
    hinweise.forEach((h, i) => doc.text(h, 14, 34 + i * 8))
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const hinweise = [
      '• Formular Steuererklärung (Kanton): Liegenschaft im Ausland deklarieren',
      '• Mieteinnahmen als Einkommen aus unbeweglichem Vermögen',
      '• DBA Deutschland–Schweiz: DE hat Besteuerungsrecht, CH rechnet an',
      '• Liegenschaftsunterhalt: pauschale oder effektive Methode wählen',
      '• Hypozinsen als Schuldzinsen abziehbar (wenn Hypothek vorhanden)',
      '• Vermögenssteuerwert der Liegenschaft ermitteln lassen',
    ]
    hinweise.forEach((h, i) => doc.text(h, 14, 34 + i * 8))
  }

  // Footer alle Seiten
  for (let i = 1; i <= doc.internal.getNumberOfPages(); i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Erstellt am ${format(new Date(), 'dd.MM.yyyy', { locale: de })} – Mietwohnungs-Tracker`, 14, 290)
    doc.text(`Seite ${i} / ${doc.internal.getNumberOfPages()}`, 180, 290)
  }

  doc.save(`Steuer_${jahr}_${land}_${(wohnung.adresse || 'Wohnung').replace(/\s/g, '_')}.pdf`)
}

// ── CSV Export ─────────────────────────────────────────────
export function exportCSV({ buchungen, jahr, wohnung }) {
  const jahrBuchungen = buchungen.filter(b => b.datum?.startsWith(String(jahr)))
  const header = ['Datum', 'Typ', 'Kategorie', 'Betrag', 'Währung', 'Notiz']
  const rows = jahrBuchungen.map(b => [
    b.datum || '',
    b.typ === 'einnahme' ? 'Einnahme' : 'Ausgabe',
    b.kategorieLabel || b.kategorie || '',
    (b.betrag || 0).toFixed(2),
    wohnung.waehrung || 'EUR',
    `"${(b.notiz || '').replace(/"/g, '""')}"`
  ])
  const csv = [header, ...rows].map(r => r.join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Buchungen_${jahr}_${(wohnung.adresse || 'Wohnung').replace(/\s/g, '_')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Helpers ────────────────────────────────────────────────
function formatWaehrung(betrag, waehrung) {
  const sym = waehrung === 'CHF' ? 'CHF ' : '€'
  return `${sym}${betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
