import assert from 'node:assert/strict'
import test from 'node:test'
import { tankMillilitres } from '../src/api/decaid/adapters.ts'
import { calibration, capabilities, cupWarmer, lighting, preheat, sensors } from '../src/api/decaid/hardwareValidation.ts'
import { createMachineSession, hasCapability } from '../src/features/machine/machineSession.ts'
import { createHardwareActions, sameFields } from '../src/features/machine/hardwareActions.ts'
import { waterTankLevelState } from '../src/domain/brewing.ts'
import { displayWater, mergeWaterLevels } from '../src/features/machine/waterTelemetry.ts'
import { machineWeightFlow } from '../src/features/machine/scaleTelemetry.ts'
import { probeTemperature, temperatureSensor } from '../src/features/machine/sensorTelemetry.ts'
import { color16, color8 } from '../src/features/machine/colorPalette.ts'
import { brewingFixture } from '../src/fixtures/brewingFixture.ts'

test('water preserves heights above the old limit without inventing a percentage', () => {
  for (const [height, volume] of [[43, 1207], [50, 1453], [60, 1808], [49.6, 1453]]) {
    assert.equal(tankMillilitres(height), volume)
    const model = displayWater(brewingFixture, { currentLevel: height }, 'normal')
    const tank = model.utilities.find(item => item.id === 'tank')!
    assert.equal(tank.levelPercent, undefined)
    assert.equal(tank.waterLevelMm, height)
    assert.equal(tank.metrics[0].value, String(volume))
    assert.equal(displayWater(model, { currentLevel: height }, 'normal'), model)
  }
  for (const invalid of [NaN, Infinity, -1, 68]) assert.equal(tankMillilitres(invalid), undefined)
  assert.equal(tankMillilitres(67), 2058)
  assert.equal(tankMillilitres(0), 0)
})

test('threshold-only frames preserve height; invalid readings clear rather than fabricate', () => {
  const previous = { currentLevel: 50, refillLevel: 10 }
  assert.deepEqual(mergeWaterLevels(previous, { refillLevel: 12 }), { currentLevel: 50, refillLevel: 12 })
  assert.deepEqual(mergeWaterLevels(previous, { currentLevel: NaN }), { currentLevel: undefined, refillLevel: 10 })
  assert.equal(displayWater(brewingFixture, { currentLevel: 70 }, 'normal').utilities.find(item => item.id === 'tank')?.metrics[0].value, '-')
  assert.equal(waterTankLevelState(0), 'warning')
  assert.equal(waterTankLevelState(0, false, { warningLevelMl: 426, refillKit: true }), 'normal')
  assert.equal(waterTankLevelState(1500, true, { warningLevelMl: 426, refillKit: true }), 'needsWater')
  assert.equal(waterTankLevelState(NaN), 'normal')
})

test('machine changes invalidate metadata, state and old responses', () => {
  const store = createMachineSession()
  store.connect('bengle')
  const generation = store.get().generation
  store.metadata(generation, { model: 'Bengle', extra: { refillKit: true } }, ['cupWarmer'])
  store.observeState('idle')
  assert.equal(hasCapability('cupWarmer', store.get()), true)
  store.connect('de1')
  store.metadata(generation, { model: 'Bengle' }, ['cupWarmer'])
  assert.equal(store.get().info, undefined)
  assert.equal(store.get().state, undefined)
  assert.equal(hasCapability('cupWarmer', store.get()), false)
  store.metadata(store.get().generation, { model: 'DE1' }, [])
  assert.equal(store.get().metadataStatus, 'ready')
  store.connect(undefined)
  assert.equal(store.get().capabilities, undefined)
  store.connect('de1')
  store.metadata(store.get().generation, undefined, undefined)
  assert.equal(store.get().metadataStatus, 'unavailable')
})

test('machine flow wins only for integrated-scale machines and finite readings', () => {
  assert.equal(machineWeightFlow(true, 2, 9), 2)
  assert.equal(machineWeightFlow(false, 2, 9), 9)
  assert.equal(machineWeightFlow(true, NaN, 9), 9)
  assert.equal(machineWeightFlow(true, undefined, NaN), undefined)
  assert.equal(machineWeightFlow(true, 0, 9), 0)
})

test('hardware validation rejects malformed states and preserves explicit boot-off state', () => {
  assert.deepEqual(capabilities({ capabilities: [] }), [])
  assert.throws(() => capabilities({}))
  assert.throws(() => capabilities({ capabilities: [1] }))
  assert.deepEqual(cupWarmer({ temperature: 60, enabled: false, currentTemperature: null }), { temperature: 60, enabled: false, currentTemperature: null })
  for (const temperature of [80.1, -1, Infinity, 60.5]) assert.throws(() => cupWarmer({ temperature, enabled: false, currentTemperature: null }))
  assert.throws(() => preheat({ enabled: true, leadMinutes: 121, active: false }))
  assert.throws(() => calibration({ step: 'idle' }))
  assert.throws(() => lighting({ frontStrip: { awake: '#ffffff', sleeping: '000000000000' } }))
  assert.equal(color16('#1234ab'), '12123434ABAB')
  assert.equal(color8('12123434ABAB'), '#1234ab')
})

test('hardware actions serialize writes and reject capability, busy-state and stale-session requests', async () => {
  const store = createMachineSession()
  const run = createHardwareActions(store.get)
  store.connect('bengle')
  const generation = store.get().generation
  let writes = 0
  const write = async () => { writes++ }
  const read = async () => ({ enabled: false })
  await assert.rejects(run('cupWarmer', generation, write, read, () => true))
  store.metadata(generation, {}, ['cupWarmer', 'scaleCalibration'])
  store.observeState('espresso')
  await assert.rejects(run('scaleCalibration', generation, write, read, () => true, true))
  assert.equal(writes, 0)
  store.observeState('idle')
  let finish: () => void = () => undefined
  const pending = run('cupWarmer', generation, () => new Promise<void>(resolve => { finish = resolve }), read, () => true)
  await assert.rejects(run('cupWarmer', generation, write, read, () => true))
  store.connect('other')
  finish()
  await assert.rejects(pending, /Machine changed/)
  assert.equal(writes, 0)
})

test('ambiguous writes are not retried and mismatched readback fails', async () => {
  const store = createMachineSession()
  store.connect('bengle')
  const generation = store.get().generation
  store.metadata(generation, {}, ['cupWarmer'])
  store.observeState('idle')
  const run = createHardwareActions(store.get)
  let calls = 0
  await assert.rejects(run('cupWarmer', generation, async () => { calls++; throw new Error('timeout') }, async () => false, () => true))
  assert.equal(calls, 1)
  await assert.rejects(run('cupWarmer', generation, async () => {}, async () => ({ enabled: true }), value => sameFields({ enabled: false }, value)), /readback mismatch/)
})

test('temperature discovery uses manifests and rejects stale, placeholder and invalid frames', () => {
  const list = sensors([{ name: 'Probe', info: { id: 'probe:a/b', dataChannels: [{ key: 'temperature', type: 'number' }] } }])
  assert.equal(temperatureSensor(list)?.id, 'probe:a/b')
  const now = Date.now()
  const timestamp = new Date(now).toISOString()
  assert.equal(probeTemperature({ timestamp, temperature: 65 }, now), 65)
  assert.equal(probeTemperature({ timestamp, values: { temperature: 42 } }, now), 42)
  assert.equal(probeTemperature({ temperature: 65 }, now), undefined)
  assert.equal(probeTemperature({ timestamp, temperature: 0 }, now), undefined)
  assert.equal(probeTemperature({ timestamp, temperature: NaN }, now), undefined)
  assert.equal(probeTemperature({ timestamp, temperature: 65 }, now + 5001), undefined)
  assert.equal(temperatureSensor([]), undefined)
})
