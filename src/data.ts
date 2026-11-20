// One deterministic dataset drives every number on every screen.
// Nothing here is copied from the Figma designs: all values are invented and generated
// from the date itself, so every participant sees exactly the same thing.

import { DATA_HORIZON_DAYS, GRAPH_DAYS, TODAY, TODAY_STATE } from './config'
import { addDays, compact, dow } from './dates'

export type Status = 'Scheduled' | 'Delivered' | 'Failed'

export type DeliveryRow = {
  id: string
  destination: string
  file: string
  service: string
  publication: string
  runDate: string // ISO, always equal to the day it belongs to
  /** Time cell text, e.g. "Scheduled to send at 10:32 UTC" or "08:15 UTC" */
  time: string
  status: Status
  entities: number
  cause?: string
}

export type Banner = { count: number; destination: string; cause: string }

export type Phase = 'morning' | 'afternoon' | 'past'

export type DayData = {
  date: string
  isToday: boolean
  isSunday: boolean
  /** morning / afternoon apply to today only; every other day is 'past' */
  phase: Phase
  /** Processed / total is the main tile. Not processed + Rejected + Processed = total (today). */
  received: { total: number; processed: number; notProcessed: number; rejected: number; rejectedResolved: number }
  /** Delivered / owed is the main tile. Delivered + Scheduled + Failed = owed (today). */
  sent: { owed: number; delivered: number; scheduled: number; failed: number; notDelivered: number; failuresResolved: number }
  /** Checked / checkable is the main tile. Matched + Mismatched = Checked (today). */
  checks: { checkable: number; checked: number; mismatched: number; matched: number; mismatchesResolved: number }
  /** Accuracy of the checked values, in percent. null until today's checks come in. */
  accuracy: { static: number | null; dynamic: number | null }
  banner: Banner | null
  rows: DeliveryRow[]
}

// ---------- seeded random ----------

function hash(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const between = (r: () => number, lo: number, hi: number) => Math.round(lo + r() * (hi - lo))

// ---------- reference lists (all invented) ----------

const DESTINATIONS = [
  { name: 'Northgate Wealth Platform', code: 'ngwp' },
  { name: 'Corvane Distribution', code: 'corv' },
  { name: 'Aldermoor Client Portal', code: 'aldm' },
  { name: 'Brightwell Advisory Network', code: 'brtw' },
]

const PUBLICATIONS = [
  { label: 'KIID documents, UK', slug: 'kiid', ext: 'zip', service: 'Regulatory filing' },
  { label: 'Factsheets, UK retail', slug: 'factsheets', ext: 'zip', service: 'Data dissemination' },
  { label: 'Daily prices, EU', slug: 'pricing', ext: 'json', service: 'Data dissemination' },
  { label: 'NAV feed, Global', slug: 'nav', ext: 'csv', service: 'Data dissemination' },
]

/**
 * Days that had failures, as offsets from today. They have all been resolved by now, so those
 * days show "Failures resolved" and no banner. Each has a different cause.
 */
const FAILURES = [
  { offset: -2, count: 2, dest: 0, cause: 'The destination refused our login (SFTP authentication failed).' },
  { offset: -6, count: 1, dest: 2, cause: 'The destination rejected the file format (schema validation failed).' },
  { offset: -10, count: 1, dest: 1, cause: 'The destination could not be reached (connection timed out).' },
]

/** The failure that is live on today's afternoon view. */
const LIVE_FAILURE = { count: 2, dest: 0, cause: 'The destination refused our login (SFTP authentication failed).' }

function failureFor(iso: string) {
  for (const f of FAILURES) {
    let date = addDays(TODAY, f.offset)
    if (dow(date) === 0) date = addDays(date, -1) // nothing runs on Sundays
    if (date === iso) return f
  }
  return null
}

// ---------- raw generation (any date) ----------

type Raw = Omit<DayData, 'rows' | 'banner'> & { failure: { count: number; dest: number; cause: string } | null }

const rawCache = new Map<string, Raw>()

function raw(iso: string): Raw {
  const cached = rawCache.get(iso)
  if (cached) return cached
  const isToday = iso === TODAY
  const isSunday = dow(iso) === 0
  const phase: Phase = isToday ? TODAY_STATE : 'past'
  const zero: Raw = {
    date: iso,
    isToday,
    isSunday,
    phase,
    received: { total: 0, processed: 0, notProcessed: 0, rejected: 0, rejectedResolved: 0 },
    sent: { owed: 0, delivered: 0, scheduled: 0, failed: 0, notDelivered: 0, failuresResolved: 0 },
    checks: { checkable: 0, checked: 0, mismatched: 0, matched: 0, mismatchesResolved: 0 },
    accuracy: { static: null, dynamic: null },
    failure: null,
  }
  if (isSunday) {
    rawCache.set(iso, zero)
    return zero
  }
  const r = mulberry32(hash(iso))
  const saturday = dow(iso) === 6

  const owed = saturday ? between(r, 36, 52) : between(r, 55, 112)
  const out: Raw = { ...zero, received: { ...zero.received }, sent: { ...zero.sent }, checks: { ...zero.checks } }

  if (phase === 'morning') {
    // Early morning: files are in and scheduled. Nothing sent or checked yet.
    const total = between(r, 3, 9)
    const rejected = r() < 0.25 ? 1 : 0
    out.received = { total, processed: total - rejected, notProcessed: 0, rejected, rejectedResolved: 0 }
    out.sent = { owed, delivered: 0, scheduled: owed, failed: 0, notDelivered: 0, failuresResolved: 0 }
  } else if (phase === 'afternoon') {
    // Afternoon: part-way through the day, with a live failure.
    const total = between(r, 12, 24)
    const notProcessed = between(r, 1, 2)
    out.received = { total, processed: total - notProcessed, notProcessed, rejected: 0, rejectedResolved: 0 }
    const failed = LIVE_FAILURE.count
    const delivered = Math.round((owed * between(r, 55, 70)) / 100)
    out.sent = { owed, delivered, scheduled: owed - delivered - failed, failed, notDelivered: 0, failuresResolved: 0 }
    const checkable = Math.round(delivered * 0.9)
    const checked = Math.round((checkable * between(r, 25, 40)) / 100)
    const mismatched = r() < 0.25 ? 1 : 0
    out.checks = { checkable, checked, mismatched, matched: checked - mismatched, mismatchesResolved: 0 }
    out.accuracy = { static: 100, dynamic: 99 }
    out.failure = LIVE_FAILURE
  } else {
    // A finished day: everything is processed and delivered; problems that came up were resolved.
    const total = saturday ? between(r, 6, 12) : between(r, 14, 34)
    const rejectedResolved = r() < 0.5 ? between(r, 1, 2) : 0
    out.received = { total, processed: total, notProcessed: 0, rejected: 0, rejectedResolved }
    const failure = failureFor(iso)
    out.sent = { owed, delivered: owed, scheduled: 0, failed: 0, notDelivered: 0, failuresResolved: failure ? failure.count : 0 }
    const checkable = Math.max(8, Math.round((owed * between(r, 45, 60)) / 100))
    const checked = Math.max(0, checkable - between(r, 0, 3))
    out.checks = {
      checkable,
      checked,
      mismatched: 0,
      matched: checked,
      mismatchesResolved: r() < 0.6 ? between(r, 1, 2) : 0,
    }
    out.accuracy = {
      static: r() < 0.7 ? 100 : between(r, 98, 99),
      dynamic: r() < 0.4 ? 100 : between(r, 96, 99),
    }
    out.failure = null
  }
  rawCache.set(iso, out)
  return out
}

// ---------- public API ----------

export const EARLIEST = addDays(TODAY, -DATA_HORIZON_DAYS)

/** A date can be selected if it has data: from 16 days before today up to today. */
export function isAvailable(iso: string): boolean {
  return iso >= EARLIEST && iso <= TODAY
}

function buildRows(base: Raw): DeliveryRow[] {
  const { date, sent, failure, isSunday, phase } = base
  if (isSunday) return []
  const r = mulberry32(hash(date + ':rows'))
  const MAX_ROWS = 5
  const failedRows = Math.min(sent.failed, MAX_ROWS)
  const scheduledRows = Math.min(sent.scheduled, phase === 'afternoon' ? 1 : MAX_ROWS - failedRows)
  const deliveredRows = Math.min(sent.delivered, MAX_ROWS - failedRows - scheduledRows)

  const make = (i: number, status: Status, destIndex: number, time: string, cause?: string): DeliveryRow => {
    const dest = DESTINATIONS[destIndex]
    const pub = PUBLICATIONS[Math.floor(r() * PUBLICATIONS.length)]
    return {
      id: `${date}-${status.toLowerCase()}-${i}`,
      destination: dest.name,
      file: `${dest.code}_${pub.slug}_${compact(date)}.${pub.ext}`,
      service: pub.service,
      publication: pub.label,
      runDate: date,
      time,
      status,
      entities: between(r, 40, 900),
      cause,
    }
  }
  const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const randTime = (lo: number, hi: number) => {
    const mins = between(r, lo * 60, hi * 60)
    return { mins, label: hhmm(Math.floor(mins / 60), mins % 60) }
  }

  const rows: DeliveryRow[] = []
  for (let i = 0; i < failedRows; i++) {
    const t = randTime(6, 11)
    rows.push(make(i, 'Failed', failure ? failure.dest : 0, `${t.label} UTC`, failure?.cause))
  }
  for (let i = 0; i < scheduledRows; i++) {
    const t = phase === 'afternoon' ? randTime(14.75, 17) : randTime(9.25, 16.75)
    rows.push(make(i, 'Scheduled', Math.floor(r() * DESTINATIONS.length), `Scheduled to send at ${t.label} UTC`))
  }
  for (let i = 0; i < deliveredRows; i++) {
    const t = phase === 'past' ? randTime(5.5, 14.75) : randTime(5.5, 14)
    rows.push(make(i, 'Delivered', Math.floor(r() * DESTINATIONS.length), `${t.label} UTC`))
  }
  return sortRows(rows, 'time', 'desc')
}

export type SortKey = 'destination' | 'service' | 'runDate' | 'time' | 'status'

const timeMins = (row: DeliveryRow) => {
  const m = /(\d{2}):(\d{2})/.exec(row.time)
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0
}

/** Sorts a copy of the rows. Latest first when sorting by time, descending. */
export function sortRows(rows: DeliveryRow[], key: SortKey, dir: 'asc' | 'desc'): DeliveryRow[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const c =
      key === 'time'
        ? timeMins(a) - timeMins(b)
        : String(a[key]).localeCompare(String(b[key]))
    return c !== 0 ? sign * c : timeMins(b) - timeMins(a)
  })
}

const dayCache = new Map<string, DayData>()

/** Full data for a date. Only call for available dates. */
export function getDay(iso: string): DayData {
  const cached = dayCache.get(iso)
  if (cached) return cached
  const base = raw(iso)
  const day: DayData = {
    date: iso,
    isToday: base.isToday,
    isSunday: base.isSunday,
    phase: base.phase,
    received: base.received,
    sent: base.sent,
    checks: base.checks,
    accuracy: base.accuracy,
    banner: base.failure
      ? {
          count: base.failure.count,
          destination: DESTINATIONS[base.failure.dest].name,
          cause: base.failure.cause,
        }
      : null,
    rows: buildRows(base),
  }
  dayCache.set(iso, day)
  return day
}

/** The days shown on the graph, ending today. */
export function graphDates(): string[] {
  const out: string[] = []
  for (let i = GRAPH_DAYS - 1; i >= 0; i--) out.push(addDays(TODAY, -i))
  return out
}

export type GraphPoint = { date: string; available: boolean; processed: number; delivered: number }

/** Points for the graph. They come from exactly the same figures the page shows for that date. */
export function graphPoint(iso: string): GraphPoint {
  if (!isAvailable(iso)) return { date: iso, available: false, processed: 0, delivered: 0 }
  const d = getDay(iso)
  return { date: iso, available: true, processed: d.received.processed, delivered: d.sent.delivered }
}
