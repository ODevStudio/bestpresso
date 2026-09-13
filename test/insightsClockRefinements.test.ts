import assert from 'node:assert/strict'
import test from 'node:test'
import { insightHour, insightHourRange, insightPeriods, toggleHour } from '../src/features/insights/insightClock.ts'
import { clockPoint, coxcombSector } from '../src/features/insights/coxcomb.ts'

test('insight period labels follow the selected duration', () => {
  for (const days of [7, 30, 180]) assert.deepEqual(insightPeriods(days), [`Last ${days} days`, `Previous ${days} days`])
})
test('hour labels honor explicit and device clock preferences', () => {
  assert.equal(insightHour(0, '12h'), '12 am')
  assert.equal(insightHour(12, '12h'), '12 pm')
  assert.equal(insightHour(18, '12h'), '6 pm')
  assert.equal(insightHour(15, '12h', true), '3')
  assert.equal(insightHour(21, '12h', true), '9')
  for (const hour of [0, 3, 6, 9, 12, 15, 18, 21]) assert.equal(insightHour(hour, '24h'), String(hour))
  assert.equal(insightHour(15, 'device', false, 'en-US'), '3 pm')
  assert.equal(insightHour(15, 'device', false, 'en-GB'), '15')
  assert.equal(insightHourRange(11, '12h'), '10 pm–12 am')
  assert.equal(insightHourRange(11, '24h'), '22–0')
})
test('noon is above midnight and sectors rotate with their labels', () => {
  assert.ok(clockPoint(12 * 15 + 180, 100)[1] < 136)
  assert.ok(clockPoint(180, 100)[1] > 136)
  assert.match(coxcombSector(0, 102, 0), /^M 136\.000 168\.000 L 136\.000 238\.000/)
})
test('reselecting the same hour clears it', () => {
  assert.equal(toggleHour(null, 4), 4)
  assert.equal(toggleHour(4, 4), null)
  assert.equal(toggleHour(4, 5), 5)
})
