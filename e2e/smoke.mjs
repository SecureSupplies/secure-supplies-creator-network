/**
 * End-to-end smoke test.
 * Builds are expected in dist/ (run `npm run build` first — `npm run test:e2e` does).
 * Uses playwright-core with a system Chromium (CHROMIUM_PATH overrides autodetect).
 *
 * Flow covered:
 *  visitor lands → apply form submits → switch role to Creator → open campaign →
 *  links page → earnings ledger shows commissions → submissions list →
 *  switch role to Admin → review queue / conversions / commissions / payouts render.
 */
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const DIST = new URL('../dist', import.meta.url).pathname
const PORT = 4179
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' }

const server = createServer((req, res) => {
  const urlPath = req.url.split('?')[0]
  let file = join(DIST, urlPath === '/' ? 'index.html' : urlPath)
  if (!existsSync(file)) file = join(DIST, 'index.html') // SPA fallback
  res.setHeader('content-type', mime[extname(file)] ?? 'application/octet-stream')
  res.end(readFileSync(file))
})
await new Promise((r) => server.listen(PORT, r))

const executablePath =
  process.env.CHROMIUM_PATH ??
  ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync)

const browser = await chromium.launch({ executablePath })
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
const base = `http://localhost:${PORT}`
let failures = 0

async function check(name, fn) {
  try {
    await fn()
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failures += 1
    console.error(`  ✗ ${name}: ${e.message}`)
  }
}

console.log('Smoke test: public site')
await page.goto(base, { waitUntil: 'networkidle' })
await check('landing renders with DEMO DATA banner', async () => {
  await page.waitForSelector('text=DEMO DATA', { timeout: 5000 })
  await page.waitForSelector('text=Learn. Build. Publish. Refer.')
})
await check('creator application submits', async () => {
  await page.goto(`${base}/apply`, { waitUntil: 'networkidle' })
  await page.fill('#name', 'Smoke Tester')
  await page.fill('#email', 'smoke@example.com')
  await page.fill('#channel', 'https://example.com/channel')
  await page.check('input[type="checkbox"]')
  await page.click('button[type="submit"]')
  await page.waitForSelector('text=Application received')
})

console.log('Smoke test: creator portal')
await check('role switch → creator dashboard', async () => {
  await page.click('button:has-text("Creator")')
  await page.goto(`${base}/creator/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Welcome back')
})
await check('campaign marketplace and detail', async () => {
  await page.goto(`${base}/creator/campaigns`, { waitUntil: 'networkidle' })
  await page.click('text=Open campaign')
  await page.waitForSelector('text=Approved hooks')
})
await check('referral links page', async () => {
  await page.goto(`${base}/creator/links`, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=go.securesupplies.us')
})
await check('earnings ledger shows commission entries', async () => {
  await page.goto(`${base}/creator/earnings`, { waitUntil: 'networkidle' })
  await page.waitForSelector('table.ss-table')
})
await check('submissions list renders', async () => {
  await page.goto(`${base}/creator/submissions`, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Content submissions')
})

console.log('Smoke test: admin portal')
await check('admin dashboard KPIs', async () => {
  await page.click('button:has-text("Admin")')
  await page.goto(`${base}/admin/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Program dashboard')
})
for (const [path, marker] of [
  ['/admin/submissions', 'Content review queue'],
  ['/admin/conversions', 'Conversions'],
  ['/admin/commissions', 'Commission ledger'],
  ['/admin/payouts', 'Payout batches'],
  ['/admin/commission-rules', 'DISABLED'],
]) {
  await check(`${path} renders`, async () => {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
    await page.waitForSelector(`text=${marker}`)
  })
}

await browser.close()
server.close()
if (failures > 0) {
  console.error(`\n${failures} smoke check(s) failed`)
  process.exit(1)
}
console.log('\nAll smoke checks passed')
