import { chromium } from 'playwright-core'
const [,, url, out, w = '1440', h = '1100', action = ''] = process.argv
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForSelector('[data-testid="overview"]')
if (action === 'nav') await page.getByRole('button', { name: 'Open navigation' }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
