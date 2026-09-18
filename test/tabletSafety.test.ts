import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { shouldAutoTareAtShotStart } from '../src/features/brew/liveShotState.ts'
import { backgroundScaleScanDelayMs, BACKGROUND_SCALE_SCAN_MAX_DELAY_MS, shouldRunBackgroundScaleScan } from '../src/features/brew/sleepControl.ts'

const brewingSource = readFileSync(new URL('../src/features/brew/useBrewingData.ts', import.meta.url), 'utf8')

test('H3: auto-tares only while the shot is still being prepared', () => {
  assert.equal(shouldAutoTareAtShotStart({ state: { state: 'espresso', substate: 'preparingForShot' } }), true)
  assert.equal(shouldAutoTareAtShotStart({ state: { state: 'Espresso', substate: 'PreparingForShot' } }), true)
})

test('H3: a session that starts mid-shot never zeroes the cup', () => {
  // Socket reconnect, WebView reload or resume while water is already flowing.
  for (const substate of ['preinfusion', 'pouring', 'pouringDone', 'idle']) {
    assert.equal(shouldAutoTareAtShotStart({ state: { state: 'espresso', substate }, profileFrame: 2 }), false, substate)
  }
  assert.equal(shouldAutoTareAtShotStart({ state: 'espresso' }), false)
  assert.equal(shouldAutoTareAtShotStart({ state: { state: 'skipStep', substate: 'preparingForShot' } }), false)
  assert.equal(shouldAutoTareAtShotStart({ state: { state: 'hotWater', substate: 'preparingForShot' } }), false)
})

test('H3: the live session only requests the silent tare through the pre-pour gate', () => {
  const silentTares = brewingSource.match(/.*requestScaleTare\(true\).*/g) ?? []
  assert.equal(silentTares.length, 1)
  assert.match(silentTares[0], /if \(shouldAutoTareAtShotStart\(snapshot\)\) void requestScaleTare\(true\)/)
})

test('M1: the background scale scan never runs while the machine is busy', () => {
  assert.equal(shouldRunBackgroundScaleScan('preferred-scale', false, 'ready', true), false)
  assert.equal(shouldRunBackgroundScaleScan('preferred-scale', false, 'ready', false), true)
  assert.match(brewingSource, /const machineBusy = Boolean\(liveShotSession\.current \|\| utilityOperationSession\.current\)/)
  assert.match(brewingSource, /shouldRunBackgroundScaleScan\(preferredScaleId, connectedScale\.current, previousReadiness\.current, machineBusy\)/)
})

test('M1: unsuccessful background scans back off exponentially up to five minutes', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(backgroundScaleScanDelayMs), [5_000, 10_000, 20_000, 40_000, 80_000, 160_000, 300_000])
  assert.equal(backgroundScaleScanDelayMs(500), BACKGROUND_SCALE_SCAN_MAX_DELAY_MS)
  assert.equal(backgroundScaleScanDelayMs(-3), 5_000)
  assert.match(brewingSource, /\}, backgroundScaleScanDelayMs\(unsuccessfulBackgroundScaleScans\)\)/)
  assert.match(brewingSource, /unsuccessfulBackgroundScaleScans = connectedScale\.current \? 0 : unsuccessfulBackgroundScaleScans \+ 1/)
})
