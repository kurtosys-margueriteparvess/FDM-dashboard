// End-to-end checks in a real browser. Run the preview server first:
//   npm run build && npx vite preview --port 4173
// then: npm run verify   (BASE=http://localhost:4173/ by default)
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:4173/'
const OUT = 'verification'
mkdirSync(OUT, { recursive: true })

let failures = 0
const pass = (m) => console.log('  ok  ', m)
const fail = (m) => {
  failures++
  console.error('  FAIL', m)
}
const check = (cond, m) => (cond ? pass(m) : fail(m))
const eq = (a, b, m) => (a === b ? pass(`${m} (${a})`) : fail(`${m}: expected ${b}, got ${a}`))
const num = async (page, id) => Number((await page.getByTestId(id).innerText()).replace(/,/g, ''))

const addDays = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
const field = (iso) => `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
const external = []
page.on('request', (r) => {
  const u = new URL(r.url())
  if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol.startsWith('http')) external.push(r.url())
})

await page.goto(BASE)
await page.waitForSelector('[data-testid="overview"]')
const TODAY = await page.getByTestId('overview').getAttribute('data-date')
const EARLIEST = addDays(TODAY, -16)
console.log(`today = ${TODAY}, earliest selectable = ${EARLIEST}`)

// ---------------------------------------------------------------- 1. first load: early morning
console.log('\n1. First load shows the early-morning state')
eq(await page.getByTestId('date-field').innerText(), field(TODAY), 'date field shows today')
check((await page.getByTestId('showing-label').innerText()).includes('Showing'), 'graph says which day is shown')
check(await page.getByTestId('accuracy-placeholder').isVisible(), 'Assurance shows its placeholder')
eq(await page.getByTestId('accuracy').count(), 0, 'no accuracy percentage yet')
eq(await page.getByTestId('banner').count(), 0, 'no failure banner')
eq(await num(page, 'figure-failed'), 0, 'Failed is 0')
eq(await num(page, 'figure-delivered'), 0, 'Files delivered is 0')
eq(await num(page, 'figure-checked'), 0, 'Checked is 0')
eq(await num(page, 'figure-scheduled'), await num(page, 'figure-owed'), 'Scheduled equals Owed')
check((await num(page, 'figure-received')) > 0, 'Received already has data')
check((await num(page, 'figure-rejected')) >= 1, 'at least one Rejected')
const rows0 = page.getByTestId('delivery-row')
const n0 = await rows0.count()
check(n0 >= 3 && n0 <= 5, `table lists 3 to 5 scheduled rows (${n0})`)
check(await page.getByText('See all deliveries').isVisible(), 'See all deliveries is shown (not clickable)')
const statuses0 = await rows0.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
check(statuses0.every((s) => s.includes('Scheduled')), 'every early-morning row is Scheduled')
const sel0 = await page.getByTestId('graph-selected').getAttribute('data-date')
eq(sel0, TODAY, 'graph highlights today')
await page.screenshot({ path: `${OUT}/morning-1440.png`, fullPage: true })

// ---------------------------------------------------------------- 2. graph hover and "Click to show this day"
console.log('\n2. Graph hover, pop-up and selecting a day')
const target = addDays(TODAY, -2)
const figuresBefore = await page.getByTestId('figures').innerText()
await page.locator(`[data-testid="graph-col-${target}"] rect`).first().hover()
check((await page.getByTestId('graph-ticker').count()) === 1, 'ticker shows immediately on hover')
eq(await page.getByTestId('graph-popup').count(), 0, 'card does not open straight away (hover delay)')
await page.waitForSelector('[data-testid="graph-popup"]')
eq(await page.getByTestId('graph-ticker').getAttribute('data-date'), target, 'ticker moves to the hovered day')
eq(await page.getByTestId('graph-popup').getAttribute('data-date'), target, 'pop-up is for the hovered day')
eq(await page.getByTestId('graph-selected').getAttribute('data-date'), TODAY, 'hovering does not change the selected day')
check((await page.getByTestId('figures').innerText()) === figuresBefore, 'hovering does not change the page')
const pop = {
  received: Number(await page.getByTestId('popup-received').innerText()),
  owed: Number(await page.getByTestId('popup-owed').innerText()),
  delivered: Number(await page.getByTestId('popup-delivered').innerText()),
}
await page.screenshot({ path: `${OUT}/hover-1440.png`, fullPage: true })
// move onto the pop-up itself: it must stay open so it can be clicked
const box = await page.getByTestId('graph-popup').boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + 10, { steps: 6 })
await page.waitForTimeout(300)
check(await page.getByTestId('graph-popup').isVisible(), 'pop-up stays open while the pointer is over it')
await page.getByTestId('show-day').click()
await page.waitForTimeout(200)
eq(await page.getByTestId('overview').getAttribute('data-date'), target, 'page switches to the clicked day')
eq(await page.getByTestId('date-field').innerText(), field(target), 'date field matches')
check((await page.getByTestId('showing-label').innerText()).includes(`${Number(target.slice(8))} Aug 2026`), 'Showing label matches')
eq(await page.getByTestId('graph-selected').getAttribute('data-date'), target, 'highlight moves to the clicked day')
eq(await num(page, 'figure-received'), pop.received, 'Received figure equals the pop-up')
eq(await num(page, 'figure-owed'), pop.owed, 'Owed figure equals the pop-up')
eq(await num(page, 'figure-delivered'), pop.delivered, 'Files delivered figure equals the pop-up')
const checked = await num(page, 'figure-checked')
const matched = await num(page, 'figure-matched')
check(await page.getByTestId('accuracy').isVisible(), 'accuracy appears under Assurance once checks exist')
eq(Number((await page.getByTestId('accuracy').innerText()).replace('%', '')), Math.round((100 * matched) / checked), 'accuracy = matched / checked')
const failed = await num(page, 'figure-failed')
eq(await page.getByTestId('banner').count(), failed > 0 ? 1 : 0, 'banner present only when something failed')
const rowLabels = await page.getByTestId('delivery-row').evaluateAll((els) => els.map((e) => e.textContent))
check(rowLabels.length > 0 && rowLabels.every((t) => t.includes(target) && t.includes(target.replace(/-/g, ''))), 'every row has the selected run date and a file name dated the same day')
await page.screenshot({ path: `${OUT}/afternoon-1440.png`, fullPage: true })

await page.getByRole('button', { name: 'Back to today' }).click()
eq(await page.getByTestId('overview').getAttribute('data-date'), TODAY, '"Back to today" returns to the early-morning state')
check(await page.getByTestId('accuracy-placeholder').isVisible(), 'placeholder is back')

// ---------------------------------------------------------------- 3. keyboard on the graph
console.log('\n3. Graph keyboard')
await page.getByTestId('graph-card').locator('[role="group"]').first().focus()
await page.keyboard.press('ArrowLeft')
await page.keyboard.press('ArrowLeft')
eq(await page.getByTestId('graph-ticker').getAttribute('data-date'), addDays(TODAY, -2), 'arrow keys move between days')
await page.keyboard.press('Enter')
eq(await page.getByTestId('overview').getAttribute('data-date'), addDays(TODAY, -2), 'Enter shows the day')
await page.getByRole('button', { name: 'Back to today' }).click()

// ---------------------------------------------------------------- 4. date picker
console.log('\n4. Date picker')
await page.getByRole('button', { name: /Change date/ }).click()
await page.getByRole('dialog', { name: 'Choose working date' }).waitFor()
const dayBtn = (iso) => page.locator(`button[data-date="${iso}"]`)
const prev = page.getByRole('button', { name: 'Previous month' })
const next = page.getByRole('button', { name: 'Next month' })
const after = addDays(TODAY, 1)
const before = addDays(EARLIEST, -1)
check(await dayBtn(TODAY).isEnabled(), 'today can be selected')
if (await dayBtn(after).count()) check(await dayBtn(after).isDisabled(), `${after} (tomorrow) is blocked`)
else pass(`${after} (tomorrow) is in a month the calendar does not offer`)
check(await next.isDisabled(), 'calendar cannot go past the month of today')
while (!(await dayBtn(EARLIEST).count()) && (await prev.isEnabled())) await prev.click()
check(await dayBtn(EARLIEST).isEnabled(), `the earliest allowed day (${EARLIEST}) can be selected`)
check(await dayBtn(before).isDisabled(), `${before} (17 days back) is blocked`)
check(await prev.isDisabled(), 'calendar cannot go back before the first allowed month')
await page.keyboard.press('Escape')
await page.getByRole('button', { name: /Change date/ }).click()
await page.getByRole('dialog', { name: 'Choose working date' }).waitFor()
const chosen = addDays(TODAY, -6)
if (!(await dayBtn(chosen).count())) await prev.click()
await dayBtn(chosen).click()
eq(await page.getByTestId('overview').getAttribute('data-date'), chosen, 'picking a date updates the page')
eq(await page.getByTestId('graph-selected').getAttribute('data-date'), chosen, 'and moves the graph highlight')
eq(await page.getByTestId('date-field').innerText(), field(chosen), 'and the date field')
// the earliest day has data too, even though it is not on the 13-day graph
await page.getByRole('button', { name: /Change date/ }).click()
await page.getByRole('dialog', { name: 'Choose working date' }).waitFor()
while (!(await dayBtn(EARLIEST).count())) await prev.click()
await dayBtn(EARLIEST).click()
eq(await page.getByTestId('overview').getAttribute('data-date'), EARLIEST, 'the earliest allowed day shows data')
check((await num(page, 'figure-owed')) > 0 || new Date(EARLIEST + 'T00:00:00Z').getUTCDay() === 0, 'and it is populated')
await page.getByRole('button', { name: 'Back to today' }).click()

// ---------------------------------------------------------------- 5. Sunday: nothing runs
console.log('\n5. Sunday')
const sunday = (() => {
  for (let i = 0; i < 17; i++) {
    const d = addDays(TODAY, -i)
    if (new Date(d + 'T00:00:00Z').getUTCDay() === 0) return d
  }
})()
await page.locator(`[data-testid="graph-col-${sunday}"] rect`).first().hover()
await page.getByTestId('show-day').click()
eq(await page.getByTestId('overview').getAttribute('data-date'), sunday, 'a Sunday can be shown')
eq(await num(page, 'figure-received'), 0, 'Sunday Received is 0')
eq(await num(page, 'figure-owed'), 0, 'Sunday Owed is 0')
check(await page.getByTestId('table-empty').isVisible(), 'Sunday table shows the empty message')
check(await page.getByTestId('accuracy-placeholder').isVisible(), 'Sunday shows the Assurance placeholder')
eq(await page.getByTestId('banner').count(), 0, 'Sunday has no banner')
await page.getByRole('button', { name: 'Back to today' }).click()

// ---------------------------------------------------------------- 6. file drawer
console.log('\n6. File drawer')
await page.locator(`[data-testid="graph-col-${target}"] rect`).first().hover()
await page.getByTestId('show-day').click()
const firstRow = failed > 0 ? page.getByTestId('delivery-row').filter({ hasText: 'Failed' }).first() : page.getByTestId('delivery-row').first()
await firstRow.click()
await page.waitForSelector('[data-testid="drawer"]')
const title = await page.locator('#drawer-title').innerText()
check((await firstRow.innerText()).includes(title), 'drawer shows the file of the clicked row')
check((await page.getByTestId('drawer').innerText()).includes('Cause') === (failed > 0), 'Cause appears for a failed file only')
check((await page.getByTestId('drawer').boundingBox()).x + 500 >= 1439, 'drawer opens on the right')
await page.screenshot({ path: `${OUT}/drawer-1440.png`, fullPage: false })
await page.keyboard.press('Escape')
await page.waitForTimeout(100)
eq(await page.getByTestId('drawer').count(), 0, 'Esc closes the drawer')
check(await firstRow.evaluate((el) => el === document.activeElement), 'focus returns to the row')
await firstRow.click()
await page.mouse.click(100, 400)
eq(await page.getByTestId('drawer').count(), 0, 'clicking outside closes the drawer')
await firstRow.click()
await page.getByRole('button', { name: 'Close file details' }).click()
eq(await page.getByTestId('drawer').count(), 0, 'the close button closes the drawer')
await page.getByRole('button', { name: 'Back to today' }).click()

// ---------------------------------------------------------------- 7. side navigation: hover to expand, pin to keep
console.log('\n7. Side navigation')
const navEl = page.getByTestId('nav')
const mainBefore = (await page.locator('main').boundingBox()).width
const graphBefore = (await page.getByTestId('graph-card').boundingBox()).width
check(Math.abs((await navEl.boundingBox()).width - 67) < 2, 'navigation starts as the 67px rail')
await page.mouse.move(30, 400)
await page.waitForTimeout(400)
check(Math.abs((await navEl.boundingBox()).width - 312) < 2, 'hovering the rail expands the navigation to 312')
check(Math.abs((await page.locator('main').boundingBox()).width - mainBefore) < 2, 'hover overlays the content without moving it')
await page.mouse.move(900, 400)
await page.waitForTimeout(400)
check(Math.abs((await navEl.boundingBox()).width - 67) < 2, 'moving away collapses it again')
await page.mouse.move(30, 400)
await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Pin navigation' }).click()
await page.mouse.move(900, 400)
await page.waitForTimeout(450)
const navW = (await navEl.boundingBox()).width
const mainAfter = (await page.locator('main').boundingBox()).width
const graphAfter = (await page.getByTestId('graph-card').boundingBox()).width
check(Math.abs(navW - 312) < 2, `pinned navigation stays open after the mouse leaves (${navW})`)
check(Math.abs(mainBefore - mainAfter - (312 - 67)) < 3, `pinning pushes the content (${mainBefore} to ${mainAfter})`)
check(graphAfter < graphBefore, 'graph card narrows')
const svgW = await page.getByTestId('graph-card').locator('svg').evaluate((e) => e.getAttribute('width'))
check(Math.abs(Number(svgW) - (graphAfter - 54)) < 4, `graph redraws to its new width (${svgW})`)
check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal scroll with the navigation pinned')
const disabled = await page.locator('nav[aria-label="Main"] [aria-disabled="true"]').count()
check(disabled >= 10, `navigation items are visible but not clickable (${disabled})`)
const hashBefore = await page.evaluate(() => location.hash)
await page.locator('nav[aria-label="Main"]').getByText('Deliveries', { exact: true }).click({ force: true })
eq(await page.evaluate(() => location.hash), hashBefore, 'clicking a nav item goes nowhere')
await page.screenshot({ path: `${OUT}/nav-open-1440.png`, fullPage: true })
await page.getByRole('button', { name: 'Unpin navigation' }).click()
await page.mouse.move(900, 400)
await page.waitForTimeout(450)
check(Math.abs((await page.locator('main').boundingBox()).width - mainBefore) < 3, 'unpinning gives the width back')

// the navigation scrolls on its own and stays put while the page scrolls
await page.setViewportSize({ width: 1440, height: 700 })
await page.mouse.move(30, 300)
await page.waitForTimeout(400)
const navScroll = await page.getByTestId('nav').evaluate((e) => ({ sh: e.scrollHeight, ch: e.clientHeight }))
check(navScroll.sh > navScroll.ch, `navigation is taller than the window and scrolls itself (${navScroll.sh} > ${navScroll.ch})`)
await page.getByTestId('nav').evaluate((e) => (e.scrollTop = 200))
check((await page.getByTestId('nav').evaluate((e) => e.scrollTop)) > 100, 'navigation scrolls separately')
await page.mouse.wheel(0, 600)
await page.mouse.move(900, 300)
await page.waitForTimeout(300)
const navTop = (await page.getByTestId('nav').boundingBox()).y
check(Math.abs(navTop) < 2, `navigation stays fixed in view when the page scrolls (${navTop})`)
await page.evaluate(() => window.scrollTo(0, 0))
await page.setViewportSize({ width: 1440, height: 1100 })

// ---------------------------------------------------------------- 8. figure tiles are not clickable
console.log('\n8. Figure tiles')
eq(await page.locator('[data-testid="figures"] button').count(), 0, 'no figure tile is a button')
const hashT = await page.evaluate(() => location.hash)
await page.getByTestId('figure-received').click()
await page.getByTestId('figure-failed').click()
await page.getByTestId('figure-checked').click()
eq(await page.evaluate(() => location.hash), hashT, 'clicking tiles goes nowhere')
check((await page.locator('[data-testid="figures"] [aria-disabled="true"]').count()) >= 10, 'tiles are marked as not interactive')

// ---------------------------------------------------------------- 9. responsiveness and screenshots
console.log('\n9. Widths')
for (const w of [1920, 1440, 1280, 1024]) {
  for (const navOpen of [false, true]) {
    if (w === 1024 && navOpen === false && false) continue
    await page.setViewportSize({ width: w, height: 1100 })
    await page.goto(BASE)
    await page.waitForSelector('[data-testid="overview"]')
    if (navOpen) {
      await page.mouse.move(30, 400)
      await page.waitForTimeout(300)
      await page.getByRole('button', { name: 'Pin navigation' }).click()
      await page.mouse.move(900, 400)
    }
    await page.waitForTimeout(450)
    const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    check(noScroll, `no horizontal scroll at ${w} wide, navigation ${navOpen ? 'open' : 'closed'}`)
    const overflow = await page.evaluate(() => {
      const bad = []
      document.querySelectorAll('main *').forEach((el) => {
        const r = el.getBoundingClientRect()
        const p = document.querySelector('main').getBoundingClientRect()
        if (r.width > 0 && (r.right > p.right + 1 || r.left < p.left - 1)) bad.push(el.tagName + '.' + el.className)
      })
      return bad.slice(0, 5)
    })
    check(overflow.length === 0, `nothing spills outside the content area at ${w} (${overflow.join(', ') || 'clean'})`)
    if ([1440, 1280, 1024].includes(w)) await page.screenshot({ path: `${OUT}/morning-${w}${navOpen ? '-nav' : ''}.png`, fullPage: true })
  }
}

check(external.length === 0, `no external network requests (${external.length})`)
check(errors.length === 0, `no console errors (${errors.join(' | ') || 'none'})`)
await browser.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nAll browser checks passed.')
process.exit(failures ? 1 : 0)
