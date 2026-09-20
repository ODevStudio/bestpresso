import assert from 'node:assert/strict'
import test from 'node:test'
import { displayWater, mergeWaterLevels, waterGauge, waterWarningLevelMm, waterWarningState } from '../src/features/machine/waterTelemetry.ts'
import { brewingFixture } from '../src/fixtures/brewingFixture.ts'

const bengle = { model: 'Bengle', warningLevelMl: 2000 }

test('Bengle warns at 15 mm, clears at 17 mm, and does not use mL preferences or change firmware thresholds', () => {
  assert.equal(waterWarningLevelMm('Bengle', 2000), 15)
  for (const height of [0, 14.9, 15]) assert.equal(waterWarningState({ currentLevel: height, refillLevel: 10 }, false, bengle), 'warning')
  assert.equal(waterWarningState({ currentLevel: 15.1 }, false, bengle), 'normal')
  assert.equal(waterWarningState({ currentLevel: 16.9 }, false, bengle, true), 'warning')
  assert.equal(waterWarningState({ currentLevel: 17 }, false, bengle, true), 'normal')
  const levels = mergeWaterLevels({ currentLevel: 15 }, { refillLevel: 12 })
  const state = waterWarningState(levels, false, bengle)
  const tank = displayWater(brewingFixture, levels, state).utilities.find(item => item.id === 'tank')!
  assert.equal(tank.warning, true)
  assert.equal(tank.alert, false)
  assert.equal(tank.warningLevelMm, 15)
  assert.equal(tank.refillLevelMm, 12)
})

test('missing readings clear warnings; refill kits suppress advisories but never machine needs-water', () => {
  for (const currentLevel of [undefined, NaN, Infinity, -1]) assert.equal(waterWarningState({ currentLevel }, false, bengle, true), 'normal')
  assert.equal(waterWarningState({ currentLevel: 10 }, false, { ...bengle, refillKit: true }, true), 'normal')
  assert.equal(waterWarningState({}, true, { ...bengle, refillKit: true }), 'needsWater')
  assert.equal(waterWarningState({ currentLevel: 15 }, false, { model: 'DE1', warningLevelMl: 300 }), 'normal')
  assert.equal(waterWarningState({ currentLevel: 10 }, false, { model: 'DE1', warningLevelMl: 300 }), 'warning')
})

test('the water ruler measures mm, not tank capacity, and includes taller valid readings', () => {
  for (const level of [0, 15, 43, 50, 60, 49.6]) {
    const gauge = waterGauge(level)
    assert.equal(gauge.maximumMm, 70)
    assert.equal(gauge.heightPercent, level / 70 * 100)
    assert.equal(gauge.warningPercent, 15 / 70 * 100)
  }
  assert.equal(waterGauge(80).maximumMm, 80)
  for (const invalid of [undefined, NaN, Infinity, -1]) assert.equal(waterGauge(invalid).heightPercent, undefined)
})
