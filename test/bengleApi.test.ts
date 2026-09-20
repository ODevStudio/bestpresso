import assert from 'node:assert/strict'
import test from 'node:test'
import { calibrate, setCupWarmer, setLighting, setPreheat } from '../src/api/decaid/hardware.ts'
import { updateWorkflow } from '../src/api/decaid/client.ts'
import { machineSession } from '../src/features/machine/machineSession.ts'

test('hardware writes use explicit enable, fractional calibration mass and persistent palettes', async () => {
  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window
  const writes: { path: string; body: unknown; method: string }[] = []
  Object.assign(globalThis, { window: { location: { search: '', protocol: 'http:', hostname: 'localhost' } } })
  globalThis.fetch = async (url, init) => {
    writes.push({ path: String(url), body: JSON.parse(String(init?.body)), method: String(init?.method) })
    if (String(url).endsWith('/scaleCalibration')) return new Response(JSON.stringify({ status: 'accepted', state: { step: 'calLatch', detectedCell: 'a', subState: 'settling', secondsRemaining: 5, status: 'none' } }))
    return new Response(null, { status: 204 })
  }
  try {
    await setCupWarmer({ enabled: false, temperature: 60 })
    await setPreheat({ enabled: true, leadMinutes: 20 })
    await calibrate('latch', 100.25)
    await calibrate('abort')
    await setLighting({ frontStrip: { awake: '010203040506', sleeping: '000000000000' }, backStrip: { awake: 'FFFFFFFFFFFF', sleeping: '000000000000' }, frontSwitch: { awake: 'FFFFFFFFFFFF', sleeping: 'FFFFFFFFFFFF' } })
    assert.deepEqual(writes[0].body, { temperature: 60, enabled: false })
    assert.equal(writes[1].path.endsWith('/machine/cupWarmer/preheat'), true)
    assert.deepEqual(writes[2].body, { command: 'latch', weightGrams: 100.25 })
    assert.deepEqual(writes[3].body, { command: 'abort' })
    assert.equal('frontSwitch' in (writes[4].body as object), false)
    for (const weight of [NaN, 0, 10001]) await assert.rejects(calibrate('latch', weight))
    assert.equal(writes.length, 5)
    globalThis.fetch = async () => new Response('{}', { status: 409 })
    await assert.rejects(calibrate('zero'), /409/)
    globalThis.fetch = async () => new Response('{}', { status: 404 })
    await assert.rejects(setPreheat({ enabled: false, leadMinutes: 0 }), /404/)
  } finally { globalThis.fetch = originalFetch; Object.assign(globalThis, { window: originalWindow }) }
})

test('Bengle target yield uses workflow readback without adding a stop command', async () => {
  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window
  Object.assign(globalThis, { window: { location: { search: '', protocol: 'http:', hostname: 'localhost' }, setTimeout, clearTimeout } })
  machineSession.connect('bengle')
  machineSession.metadata(machineSession.get().generation, {}, ['stopAtWeight'])
  const calls: string[] = []
  let target = 36
  globalThis.fetch = async (url, init) => {
    calls.push(`${init?.method ?? 'GET'} ${url}`)
    return new Response(JSON.stringify({ context: { targetYield: target } }))
  }
  try {
    assert.equal((await updateWorkflow({ context: { targetYield: 36 } })).context?.targetYield, 36)
    assert.equal(calls.length, 2)
    assert.equal(calls.every(call => call.endsWith('/workflow')), true)
    target = 30
    await assert.rejects(updateWorkflow({ context: { targetYield: 36 } }))
    machineSession.connect('de1')
    machineSession.metadata(machineSession.get().generation, {}, [])
    const before = calls.length
    await updateWorkflow({ context: { targetYield: 30 } })
    assert.equal(calls.length, before + 1)
  } finally {
    machineSession.connect(undefined)
    globalThis.fetch = originalFetch
    Object.assign(globalThis, { window: originalWindow })
  }
})
