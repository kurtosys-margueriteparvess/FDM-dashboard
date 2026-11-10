// Run with: npm run check:data
// Asserts every invariant over today and the 16 days before it.
import { DATA_HORIZON_DAYS, TODAY } from '../src/config'
import { addDays, compact, dow } from '../src/dates'
import { getDay, graphDates, graphPoint, isAvailable } from '../src/data'

let failures = 0
const fail = (msg: string) => {
  failures++
  console.error('FAIL', msg)
}
const eq = (a: unknown, b: unknown, msg: string) => {
  if (a !== b) fail(`${msg}: expected ${String(b)}, got ${String(a)}`)
}

const dates: string[] = []
for (let i = DATA_HORIZON_DAYS; i >= 0; i--) dates.push(addDays(TODAY, -i))
eq(dates.length, DATA_HORIZON_DAYS + 1, 'date count')

if (dow(TODAY) === 0) fail('today must not be a Sunday')
if (isAvailable(addDays(TODAY, -DATA_HORIZON_DAYS - 1))) fail('a date older than the horizon is selectable')
if (isAvailable(addDays(TODAY, 1))) fail('a future date is selectable')

for (const iso of dates) {
  const d = getDay(iso)
  const tag = `${iso} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow(iso)]})`
  eq(d.date, iso, `${tag} date`)
  eq(d.received.notProcessed + d.received.rejected + d.received.processed, d.received.total, `${tag} received breakdown`)
  eq(d.sent.scheduled + d.sent.failed + d.sent.delivered, d.sent.owed, `${tag} sent breakdown`)
  eq(d.checks.matched + d.checks.mismatched, d.checks.checked, `${tag} checks breakdown`)
  if (d.checks.checked > 0) {
    eq(d.accuracy, Math.round((100 * d.checks.matched) / d.checks.checked), `${tag} accuracy = matched / checked`)
  } else {
    eq(d.accuracy, null, `${tag} accuracy is null when nothing is checked`)
  }
  eq(d.banner !== null, d.sent.failed > 0, `${tag} banner iff failures`)
  if (d.banner) eq(d.banner.count, d.sent.failed, `${tag} banner count = Failed`)

  // Sundays: nothing runs.
  if (dow(iso) === 0) {
    const all = [d.received.total, d.sent.owed, d.sent.delivered, d.checks.checked, d.rows.length]
    if (all.some((n) => n !== 0)) fail(`${tag} Sunday must be all zeros`)
  }

  // Rows: dates and names agree, statuses agree with the figures.
  const counts = { Failed: 0, Scheduled: 0, Delivered: 0 }
  for (const row of d.rows) {
    eq(row.runDate, iso, `${tag} row run date`)
    if (!row.file.includes(`_${compact(iso)}.`)) fail(`${tag} file name date does not match: ${row.file}`)
    counts[row.status]++
    if (row.status === 'Failed' && !row.cause) fail(`${tag} failed row without a cause`)
  }
  if (counts.Failed !== Math.min(d.sent.failed, 5)) fail(`${tag} failed rows ${counts.Failed} vs Failed ${d.sent.failed}`)
  if (d.sent.scheduled > 0 && counts.Scheduled === 0) fail(`${tag} scheduled figure but no scheduled rows`)
  if (d.sent.scheduled === 0 && counts.Scheduled > 0) fail(`${tag} scheduled rows but Scheduled = 0`)
  if (d.sent.delivered === 0 && counts.Delivered > 0) fail(`${tag} delivered rows but Files delivered = 0`)

  // At most 5 rows, latest time first.
  if (d.rows.length > 5) fail(`${tag} more than 5 rows (${d.rows.length})`)
  const mins = d.rows.map((r) => {
    const m = /(\d{2}):(\d{2})/.exec(r.time)!
    return Number(m[1]) * 60 + Number(m[2])
  })
  for (let i = 1; i < mins.length; i++) if (mins[i] > mins[i - 1]) fail(`${tag} rows not in descending time order`)

  // Graph points equal the figures.
  const p = graphPoint(iso)
  eq(p.received, d.received.total, `${tag} graph Received`)
  eq(p.owed, d.sent.owed, `${tag} graph Owed`)
  eq(p.delivered, d.sent.delivered, `${tag} graph Delivered`)
}

// Early-morning state.
const today = getDay(TODAY)
eq(today.isToday, true, 'today flag')
if (today.received.rejected < 1) fail('today needs at least one Rejected')
if (today.received.total <= 0 || today.sent.owed <= 0) fail('today must have received and owed data already')
eq(today.sent.scheduled, today.sent.owed, 'today Scheduled = Owed')
eq(today.sent.failed, 0, 'today Failed')
eq(today.sent.delivered, 0, 'today Files delivered')
eq(today.checks.checked, 0, 'today Checked')
eq(today.accuracy, null, 'today accuracy')
eq(today.banner, null, 'today banner')

// Failures: two or three days, different causes.
const causes = new Set(dates.map((i) => getDay(i).banner?.cause).filter(Boolean))
if (causes.size < 2 || causes.size > 3) fail(`expected 2 or 3 distinct failure causes, got ${causes.size}`)

// Graph window.
const g = graphDates()
eq(g.length, 13, 'graph days')
eq(g[g.length - 1], TODAY, 'graph ends today')

// Accuracy spread and volumes (informational).
const accs = dates.map((i) => getDay(i).accuracy).filter((a): a is number => a !== null)
const inBand = accs.filter((a) => a >= 96 && a <= 99).length
console.log(`accuracy values: ${accs.join(', ')} (${inBand}/${accs.length} between 96 and 99)`)
console.log(
  'owed per day: ' + dates.map((i) => `${i.slice(5)}=${getDay(i).sent.owed}`).join(' '),
)

if (failures) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log(`\nAll checks passed for ${dates.length} dates (${dates[0]} to ${TODAY}).`)
