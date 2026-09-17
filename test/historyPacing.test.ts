import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { atLeast, BACKFILL_GAP_MS, PAGE_GAP_MS, pacedReader } from '../src/features/insights/historyPacing.ts'
import { FULL_HISTORY_INTERVAL } from '../src/features/insights/historySync.ts'

function clock() {
  let t = 0
  const slept: number[] = []
  return { now: () => t, sleep: async (ms: number) => { slept.push(ms); t += ms }, advance: (ms: number) => { t += ms }, slept }
}

test('paced reads leave a gap between one finishing and the next starting', async () => {
  const c = clock()
  const starts: number[] = []
  const read = pacedReader(async (offset: number) => { starts.push(c.now()); c.advance(600); return offset }, 750, c.now, c.sleep)
  assert.deepEqual(await Promise.all([read(0), read(100), read(200)]), [0, 100, 200])
  assert.deepEqual(starts, [0, 1350, 2700])
})

test('the first read is not delayed, and a failed read still paces the next', async () => {
  const c = clock()
  const read = pacedReader(async (fail: boolean) => { c.advance(100); if (fail) throw new Error('offline'); return 'ok' }, 750, c.now, c.sleep)
  await assert.rejects(read(true))
  assert.deepEqual(c.slept, [])
  assert.equal(await read(false), 'ok')
  assert.deepEqual(c.slept, [750])
})

test('a stretched scheduler never runs sooner than its floor', () => {
  const delays: number[] = []
  const schedule = atLeast((_callback, delay) => { delays.push(delay); return () => undefined }, 4000)
  schedule(() => undefined, 1000)
  schedule(() => undefined, 15000)
  assert.deepEqual(delays, [4000, 15000])
})

test('history reads and the backfill are paced, and full passes are rare', () => {
  const hook = readFileSync(new URL('../src/features/insights/useShotInsights.ts', import.meta.url), 'utf8')
  assert.match(hook, /page: pacedReader\(/)
  assert.match(hook, /atLeast\(/)
  assert.ok(PAGE_GAP_MS >= 500)
  assert.ok(BACKFILL_GAP_MS >= 3_000)
  assert.ok(FULL_HISTORY_INTERVAL >= 60 * 60 * 1000)
})
