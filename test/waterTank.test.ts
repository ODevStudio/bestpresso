import assert from 'node:assert/strict'
import test from 'node:test'
import { waterTankLevelState } from '../src/domain/brewing.ts'

test('uses calculated levels for advisory warnings only', () => {
  assert.equal(waterTankLevelState(427), 'normal')
  assert.equal(waterTankLevelState(426), 'warning')
  assert.equal(waterTankLevelState(301), 'warning')
  assert.equal(waterTankLevelState(300), 'warning')
})

test('lets the Decaid needs-water signal override the calculated level', () => {
  assert.equal(waterTankLevelState(1_000, true), 'needsWater')
})
