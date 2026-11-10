// One deterministic dataset drives every number on every screen.
// Nothing here is copied from the Figma designs: all values are invented and generated
// from the date itself, so every participant sees exactly the same thing.

import { ACCURACY_TARGET, DATA_HORIZON_DAYS, GRAPH_DAYS, TODAY } from './config'
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

export type DayData = {
  date: string
  isToday: boolean
  isSunday: boolean
  received: { total: number; notProcessed: number; rejected: number; processed: number }
  sent: { owed: number; scheduled: number; failed: number; delivered: number }
  checks: { checked: number; mismatched: number; matched: number }
  /** Matched / Checked, rounded. null when nothing has been checked yet. */
  accuracy: number | null
  /** Change in accuracy against the previous seven days, in percentage points. null when not defined. */
  weeklyDelta: number | null
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
  { label: 'KIID documents, UK', slug: 'kiid', ext: 'zip' },
  { label: 'Factsheets, UK retail', slug: 'factsheets', ext: 'zip' },
  { label: 'Daily prices, EU', slug: 'pricing', ext: 'json' },
  { label: 'NAV feed, Global', slug: 'nav', ext: 'csv' },
]

/** Days with failures, as offsets from today. Each has a different cause. */
const FAILURES = [
  { offset: -2, count: 2, dest: 0, cause: 'The destination refused our login (SFTP authentication failed).' },
  { offset: -6, count: 1, dest: 2, cause: 'The destination rejected the file format (schema validation failed).' },
  { offset: -10, count: 1, dest: 1, cause: 'The destination could not be reached (connection timed out).' },
]

function failureFor(iso: string) {
  for (const f of FAILURES) {
    let date = addDays(TODAY, f.offset)
    if (dow(date) === 0) date = addDays(date, -1) // nothing runs on Sundays
    if (date === iso) return f
  }
  return null
}

// ---------- raw generation (any date) ----------

type Raw = Omit<DayData, 'weeklyDelta' | 'rows' | 'banner'> & { failure: (typeof FAILURES)[number] | null }

const rawCache = new Map<string, Raw>()

function raw(iso: string): Raw {
  const cached = rawCache.get(iso)
  if (cached) return cached
  const isToday = iso === TODAY
  const isSunday = dow(iso) === 0
  const zero: Raw = {
    date: iso,
    isToday,
    isSunday,
    received: { total: 0, notProcessed: 0, rejected: 0, processed: 0 },
    sent: { owed: 0, scheduled: 0, failed: 0, delivered: 0 },
    checks: { checked: 0, mismatched: 0, matched: 0 },
    accuracy: null,
    failure: null,
  }
  if (isSunday) {
    rawCache.set(iso, zero)
    return zero
  }
  const r = mulberry32(hash(iso))
  const saturday = dow(iso) === 6

  const owed = saturday ? between(r, 36, 52) : between(r, 55, 112)
  const total = saturday ? between(r, 6, 12) : between(r, 14, 34)
  let rejected = r() < 0.4 ? 1 : r() < 0.1 ? 2 : 0
  let notProcessed = r() < 0.15 ? 1 : 0
  if (isToday && rejected === 0) rejected = 1 // the early-morning view always has at least one Rejected
  if (isToday) notProcessed = 0
  const processed = total - rejected - notProcessed

  const failure = isToday ? null : failureFor(iso)
  const failed = failure ? failure.count : 0
  const scheduled = isToday ? owed : 0
  const delivered = isToday ? 0 : owed - failed

  let checked = 0
  let mismatched = 0
  if (!isToday) {
    checked = Math.min(delivered, Math.max(35, Math.round(delivered * between(r, 45, 60) / 100)))
    mismatched = checked >= 34 ? (r() < 0.1 ? 0 : checked >= 56 && r() < 0.3 ? 2 : 1) : 0
  }
  const matched = checked - mismatched
  const accuracy = checked > 0 ? Math.round((100 * matched) / checked) : null

  const out: Raw = {
    date: iso,
    isToday,
    isSunday,
    received: { total, notProcessed, rejected, processed },
    sent: { owed, scheduled, failed, delivered },
    checks: { checked, mismatched, matched },
    accuracy,
    failure,
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

function weeklyDelta(iso: string): number | null {
  const avg = (from: number, to: number) => {
    const vals: number[] = []
    for (let o = from; o <= to; o++) {
      const a = raw(addDays(iso, -o)).accuracy
      if (a !== null) vals.push(a)
    }
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }
  const thisWeek = avg(0, 6)
  const lastWeek = avg(7, 13)
  if (thisWeek === null || lastWeek === null || raw(iso).accuracy === null) return null
  return Math.round(thisWeek - lastWeek)
}

function buildRows(base: Raw): DeliveryRow[] {
  const { date, sent, failure, isSunday } = base
  if (isSunday) return []
  const r = mulberry32(hash(date + ':rows'))
  const MAX_ROWS = 5
  const failedRows = Math.min(sent.failed, MAX_ROWS)
  const scheduledRows = Math.min(sent.scheduled, MAX_ROWS - failedRows)
  const deliveredRows = Math.min(sent.delivered, MAX_ROWS - failedRows - scheduledRows)

  const make = (i: number, status: Status, destIndex: number, time: string, cause?: string): DeliveryRow => {
    const dest = DESTINATIONS[destIndex]
    const pub = PUBLICATIONS[Math.floor(r() * PUBLICATIONS.length)]
    return {
      id: `${date}-${status.toLowerCase()}-${i}`,
      destination: dest.name,
      file: `${dest.code}_${pub.slug}_${compact(date)}.${pub.ext}`,
      service: 'Data dissemination',
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
  const sched: { mins: number; row: DeliveryRow }[] = []
  for (let i = 0; i < scheduledRows; i++) {
    const t = randTime(9.25, 16.75)
    sched.push({ mins: t.mins, row: make(i, 'Scheduled', Math.floor(r() * DESTINATIONS.length), `Scheduled to send at ${t.label} UTC`) })
  }
  sched.sort((a, b) => a.mins - b.mins).forEach((s) => rows.push(s.row))
  const deliv: { mins: number; row: DeliveryRow }[] = []
  for (let i = 0; i < deliveredRows; i++) {
    const t = randTime(5.5, 14.75)
    deliv.push({ mins: t.mins, row: make(i, 'Delivered', Math.floor(r() * DESTINATIONS.length), `${t.label} UTC`) })
  }
  deliv.sort((a, b) => b.mins - a.mins).forEach((d) => rows.push(d.row))
  // Latest first: times descend down the table (a scheduled time counts as its time).
  const mins = (row: DeliveryRow) => {
    const m = /(\d{2}):(\d{2})/.exec(row.time)
    return m ? Number(m[1]) * 60 + Number(m[2]) : 0
  }
  return rows.sort((a, b) => mins(b) - mins(a))
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
    received: base.received,
    sent: base.sent,
    checks: base.checks,
    accuracy: base.accuracy,
    weeklyDelta: weeklyDelta(iso),
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

/** The 13 days shown on the graph, ending today. */
export function graphDates(): string[] {
  const out: string[] = []
  for (let i = GRAPH_DAYS - 1; i >= 0; i--) out.push(addDays(TODAY, -i))
  return out
}

export type GraphPoint = { date: string; available: boolean; received: number; owed: number; delivered: number }

/** Points for the graph. They come from exactly the same figures the page shows for that date. */
export function graphPoint(iso: string): GraphPoint {
  if (!isAvailable(iso)) return { date: iso, available: false, received: 0, owed: 0, delivered: 0 }
  const d = getDay(iso)
  return { date: iso, available: true, received: d.received.total, owed: d.sent.owed, delivered: d.sent.delivered }
}

export { ACCURACY_TARGET }
