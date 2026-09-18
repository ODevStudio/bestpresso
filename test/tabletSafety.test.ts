import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { shouldAutoTareAtShotStart } from '../src/features/brew/liveShotState.ts'

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
