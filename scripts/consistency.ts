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

const stateOf = getDay(TODAY).phase
console.log(`checking today in the '${stateOf}' state`)

for (const iso of dates) {
  const d = getDay(iso)
  const tag = `${iso} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow(iso)]})`
  eq(d.date, iso, `${tag} date`)
  eq(d.phase, iso === TODAY ? stateOf : 'past', `${tag} phase`)
  const { received: rc, sent: sn, checks: ck, accuracy: ac } = d

  if (d.phase === 'past') {
    // A finished day: everything processed and delivered; problems are shown as resolved.
    eq(rc.processed, rc.total, `${tag} processed = received`)
    eq(rc.notProcessed + rc.rejected, 0, `${tag} nothing unprocessed or rejected`)
    eq(sn.delivered, sn.owed, `${tag} delivered = owed`)
    eq(sn.scheduled + sn.failed + sn.notDelivered, 0, `${tag} nothing scheduled, failed or undelivered`)
    eq(ck.mismatched, 0, `${tag} no open mismatches`)
    eq(ck.matched, ck.checked, `${tag} matched = checked`)
    eq(d.banner, null, `${tag} no banner on a finished day`)
  } else {
    eq(rc.notProcessed + rc.rejected + rc.processed, rc.total, `${tag} received breakdown`)
    eq(sn.scheduled + sn.failed + sn.delivered, sn.owed, `${tag} sent breakdown`)
    eq(ck.matched + ck.mismatched, ck.checked, `${tag} checks breakdown`)
    eq(d.banner !== null, sn.failed > 0, `${tag} banner iff failures`)
    if (d.banner) eq(d.banner.count, sn.failed, `${tag} banner count = Failed`)
  }
  if (rc.processed > rc.total || sn.delivered > sn.owed || ck.checked > ck.checkable) fail(`${tag} a numerator exceeds its total`)
  if (ck.checkable > sn.delivered) fail(`${tag} more checkable files than delivered files`)

  // Accuracy shows once there is something checked, and always as a pair.
  if ((ac.static === null) !== (ac.dynamic === null)) fail(`${tag} static and dynamic accuracy must appear together`)
  if (ck.checked > 0) {
    for (const v of [ac.static, ac.dynamic]) if (v === null || v < 0 || v > 100 || !Number.isInteger(v)) fail(`${tag} bad accuracy ${v}`)
  } else {
    eq(ac.static, null, `${tag} no accuracy when nothing is checked`)
  }

  // Sundays: nothing runs.
  if (dow(iso) === 0) {
    const all = [rc.total, sn.owed, sn.delivered, ck.checked, ck.checkable, d.rows.length]
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
  if (counts.Failed !== Math.min(sn.failed, 5)) fail(`${tag} failed rows ${counts.Failed} vs Failed ${sn.failed}`)
  if (sn.scheduled > 0 && counts.Scheduled === 0) fail(`${tag} scheduled figure but no scheduled rows`)
  if (sn.scheduled === 0 && counts.Scheduled > 0) fail(`${tag} scheduled rows but Scheduled = 0`)
  if (sn.delivered === 0 && counts.Delivered > 0) fail(`${tag} delivered rows but Delivered = 0`)

  // At most 5 rows, latest time first.
  if (d.rows.length > 5) fail(`${tag} more than 5 rows (${d.rows.length})`)
  const mins = d.rows.map((r) => {
    const m = /(\d{2}):(\d{2})/.exec(r.time)!
    return Number(m[1]) * 60 + Number(m[2])
  })
  for (let i = 1; i < mins.length; i++) if (mins[i] > mins[i - 1]) fail(`${tag} rows not in descending time order`)

  // Graph points equal the figures.
  const p = graphPoint(iso)
  eq(p.processed, rc.processed, `${tag} graph Processed`)
  eq(p.delivered, sn.delivered, `${tag} graph Delivered`)
}

// Today.
const today = getDay(TODAY)
eq(today.isToday, true, 'today flag')
if (today.received.total <= 0 || today.sent.owed <= 0) fail('today must have received and owed data already')
if (stateOf === 'morning') {
  eq(today.sent.scheduled, today.sent.owed, 'morning: Scheduled = Owed')
  eq(today.sent.failed, 0, 'morning: Failed')
  eq(today.sent.delivered, 0, 'morning: Delivered')
  eq(today.checks.checked, 0, 'morning: Checked')
  eq(today.checks.checkable, 0, 'morning: nothing to check yet')
  eq(today.accuracy.static, null, 'morning: accuracy')
  eq(today.banner, null, 'morning: banner')
} else {
  if (today.sent.failed < 1) fail('afternoon: needs a live failure')
  if (!today.banner) fail('afternoon: needs the banner')
  if (today.sent.delivered <= 0 || today.sent.scheduled <= 0) fail('afternoon: part delivered, part scheduled')
  if (today.checks.checked <= 0) fail('afternoon: some checks are in')
  eq(today.accuracy.static, 100, 'afternoon: static accuracy')
}

// Failures that were resolved on finished days.
const resolved = dates.filter((i) => getDay(i).sent.failuresResolved > 0)
if (resolved.length < 2) fail(`expected at least 2 days with resolved failures, got ${resolved.length}`)

// Graph window.
const g = graphDates()
eq(g.length, 13, 'graph days')
eq(g[g.length - 1], TODAY, 'graph ends today')

console.log('static accuracy: ' + dates.map((i) => getDay(i).accuracy.static ?? '-').join(' '))
console.log('dynamic accuracy: ' + dates.map((i) => getDay(i).accuracy.dynamic ?? '-').join(' '))
console.log('delivered / owed: ' + dates.map((i) => `${i.slice(5)}=${getDay(i).sent.delivered}/${getDay(i).sent.owed}`).join(' '))

if (failures) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log(`\nAll checks passed for ${dates.length} dates (${dates[0]} to ${TODAY}).`)
