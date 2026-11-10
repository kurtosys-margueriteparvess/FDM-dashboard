// Small UTC-based date helpers. Dates are ISO strings: 'YYYY-MM-DD'.

const DAY_MS = 86_400_000

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso: string, n: number): string {
  return toISO(new Date(parseISO(iso).getTime() + n * DAY_MS))
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / DAY_MS)
}

/** 0 = Sunday ... 6 = Saturday */
export function dow(iso: string): number {
  return parseISO(iso).getUTCDay()
}

const WD_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const parts = (iso: string) => {
  const d = parseISO(iso)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), w: d.getUTCDay() }
}

/** Date field format: dd/mm/yyyy */
export function fmtField(iso: string): string {
  const p = parts(iso)
  return `${String(p.d).padStart(2, '0')}/${String(p.m + 1).padStart(2, '0')}/${p.y}`
}

/** "Sat 15 Aug 2026" */
export function fmtShort(iso: string): string {
  const p = parts(iso)
  return `${WD_SHORT[p.w]} ${p.d} ${MON_SHORT[p.m]} ${p.y}`
}

/** "Wednesday 5 Aug 2026" */
export function fmtFull(iso: string): string {
  const p = parts(iso)
  return `${WD_LONG[p.w]} ${p.d} ${MON_SHORT[p.m]} ${p.y}`
}

/** "Aug 12, 2026" (file drawer) */
export function fmtDrawer(iso: string): string {
  const p = parts(iso)
  return `${MON_SHORT[p.m]} ${p.d}, ${p.y}`
}

/** "20260812" (file names) */
export function compact(iso: string): string {
  return iso.replace(/-/g, '')
}

export function axisLabel(iso: string): { weekday: string; date: string } {
  const p = parts(iso)
  return { weekday: WD_SHORT[p.w].toUpperCase(), date: `${p.d} ${MON_SHORT[p.m].toUpperCase()}` }
}

/** "3–15 Aug 2026" or "30 Jul–11 Aug 2026" */
export function fmtRange(startISO: string, endISO: string): string {
  const s = parts(startISO)
  const e = parts(endISO)
  if (s.m === e.m && s.y === e.y) return `${s.d}–${e.d} ${MON_SHORT[e.m]} ${e.y}`
  if (s.y === e.y) return `${s.d} ${MON_SHORT[s.m]}–${e.d} ${MON_SHORT[e.m]} ${e.y}`
  return `${s.d} ${MON_SHORT[s.m]} ${s.y}–${e.d} ${MON_SHORT[e.m]} ${e.y}`
}

export function monthTitle(year: number, month: number): string {
  return `${MON_LONG[month]} ${year}`
}

export function ym(iso: string): { year: number; month: number } {
  const p = parts(iso)
  return { year: p.y, month: p.m }
}

export function isoFrom(year: number, month: number, day: number): string {
  return toISO(new Date(Date.UTC(year, month, day)))
}
