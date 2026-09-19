import assert from 'node:assert/strict'
import test from 'node:test'
import { brewingFixture } from '../src/fixtures/brewingFixture.ts'
import { withDisplayedScaleWeight, withHomeMachineDisplay, withHomeTankDisplay, withScaleConnection } from '../src/features/brew/homeDisplayUpdates.ts'

test('identical displayed weight preserves the model; a visible change updates only the scale', () => {
  const model = withDisplayedScaleWeight(brewingFixture, 10.01)
  assert.equal(withDisplayedScaleWeight(model, 10.04), model)
  const next = withDisplayedScaleWeight(model, 10.06)
  assert.notEqual(next, model)
  assert.equal(next.profiles, model.profiles)
  for (const utility of model.utilities) {
    assert.equal(next.utilities.find(item => item.id === utility.id) === utility, utility.id !== 'scale')
  }
  assert.equal(next.utilities.find(item => item.id === 'scale')?.metrics[0].value, '10.1')
  assert.equal(withDisplayedScaleWeight(next, -1.2).utilities.find(item => item.id === 'scale')?.metrics[0].value, '-1.2')
  assert.equal(withDisplayedScaleWeight(next, 0).utilities.find(item => item.id === 'scale')?.metrics[0].value, '0.0')
})

test('repeated machine samples do not redraw, but temperature, readiness and alert changes always do', () => {
  const model = withHomeMachineDisplay(brewingFixture, 'ready', 160.1, 130, 'normal')
  for (let i = 0; i < 500; i++) assert.equal(withHomeMachineDisplay(model, 'ready', 160.2, 130, 'normal'), model)
  assert.equal(withHomeMachineDisplay(model, 'ready', undefined, 130, 'normal'), model)
  const warmer = withHomeMachineDisplay(model, 'ready', 161, 130, 'normal')
  assert.notEqual(warmer, model)
  assert.equal(warmer.utilities.find(u => u.id === 'water'), model.utilities.find(u => u.id === 'water'))
  assert.equal(warmer.utilities.find(u => u.id === 'tank'), model.utilities.find(u => u.id === 'tank'))
  assert.equal(withHomeMachineDisplay(model, 'sleeping', 160.1, 130, 'normal').readiness, 'sleeping')
  assert.equal(withHomeMachineDisplay(model, 'ready', 160.1, 130, 'needsWater').utilities.find(u => u.id === 'tank')?.alert, true)
  const warning = withHomeMachineDisplay(model, 'ready', 160.1, 130, 'warning')
  assert.equal(warning.utilities.find(u => u.id === 'tank')?.warning, true)
  // Color thresholds may change even if the rounded number stays the same.
  const below = withHomeMachineDisplay(model, 'ready', 129.9, 130, 'normal')
  assert.notEqual(withHomeMachineDisplay(below, 'ready', 130.1, 130, 'normal'), below)
})

test('tank display sharing preserves percentage changes and clears warnings', () => {
  const model = withHomeTankDisplay(brewingFixture, '500', 25, 'warning')
  assert.equal(withHomeTankDisplay(model, '500', 25, 'warning'), model)
  assert.notEqual(withHomeTankDisplay(model, '500', 25.1, 'warning'), model)
  assert.equal(withHomeTankDisplay(model, '500', 25, 'normal').utilities.find(u => u.id === 'tank')?.warning, false)
})

test('connection sharing keeps device identity and status changes', () => {
  const current = { status: 'connected' as const, name: 'Scale', id: 'one' }
  assert.equal(withScaleConnection(current, { ...current }), current)
  assert.notEqual(withScaleConnection(current, { ...current, id: 'two' }), current)
  assert.notEqual(withScaleConnection(current, { ...current, name: 'Renamed' }), current)
  assert.deepEqual(withScaleConnection(current, { status: 'disconnected' }), { status: 'disconnected' })
})
