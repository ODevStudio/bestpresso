import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { shouldAutoTareAtShotStart } from '../src/features/brew/liveShotState.ts'
import { requestMachineStop } from '../src/features/brew/stopRequest.ts'
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

const clientSource = readFileSync(new URL('../src/api/decaid/client.ts', import.meta.url), 'utf8')

function stopHarness(outcomes: Array<'ok' | 'throw'>, stopsAfterSend: number | null) {
  const calls: string[] = []
  let sends = 0
  let running = true
  return {
    calls,
    api: {
      sendIdle: async () => {
        const outcome = outcomes[sends] ?? 'ok'
        sends += 1
        calls.push(`idle:${outcome}`)
        if (outcome === 'throw') throw new Error('409')
        if (stopsAfterSend === sends) running = false
      },
      stillRunning: () => running,
      wait: async (ms: number) => { calls.push(`wait:${ms}`) },
    },
  }
}

test('M2: a confirmed stop sends idle exactly once', async () => {
  const { api, calls } = stopHarness(['ok'], 1)
  assert.equal(await requestMachineStop(api), 'confirmed')
  assert.deepEqual(calls, ['idle:ok', 'wait:2500'])
})

test('M2: an accepted but unconfirmed stop is resent once, then released', async () => {
  const resent = stopHarness(['ok', 'ok'], 2)
  assert.equal(await requestMachineStop(resent.api), 'confirmed')
  assert.deepEqual(resent.calls, ['idle:ok', 'wait:2500', 'idle:ok', 'wait:2500'])

  const lost = stopHarness(['ok', 'ok'], null)
  assert.equal(await requestMachineStop(lost.api), 'unconfirmed')
  assert.equal(lost.calls.filter((call) => call.startsWith('idle')).length, 2)
})

test('M2: a rejected stop is retried and reported when it keeps failing', async () => {
  const recovered = stopHarness(['throw', 'ok'], 2)
  assert.equal(await requestMachineStop(recovered.api), 'confirmed')
  const rejected = stopHarness(['throw', 'throw'], null)
  assert.equal(await requestMachineStop(rejected.api), 'failed')
})

test('M2: the stop button is released after an unconfirmed stop and state writes time out', () => {
  assert.match(brewingSource, /stillRunning: \(\) => liveShotSession\.current === session/)
  assert.match(brewingSource, /brewStopRequestInFlight\.current = false\n\s+setBrewStopPending\(false\)\n\s+showMachineActionError\(result === 'failed'\n\s+\? 'The machine did not accept the stop command\.'\n\s+: 'The machine has not confirmed the stop\. Tap Stop again\.'\)/)
  const setMachineStateSource = clientSource.slice(clientSource.indexOf('export async function setMachineState'), clientSource.indexOf('export async function setMachineProfile'))
  assert.match(setMachineStateSource, /controller\.abort\(\)/)
  assert.match(setMachineStateSource, /signal: controller\.signal/)
})

const bootSource = brewingSource.slice(brewingSource.indexOf('Promise.all([getWorkflow()'), brewingSource.indexOf('const shotSettings = subscribe'))

test('M4: connecting a scale does not rewrite Decaid settings', () => {
  assert.doesNotMatch(brewingSource, /hotWaterWeightStoppingPatch|updateSettings\(|stopHotWaterAtWeight: true/)
})

test('M4: booting the skin does not copy machine flush settings into the workflow', () => {
  assert.doesNotMatch(brewingSource, /rinseWorkflowPatchFromMachineSettings|getMachineSettings/)
  assert.match(bootSource, /const workflow = rememberFlushDuration\(initialWorkflow\)/)
})

test('M4: hot-water targets are only written on a user edit, never reconciled in the background', () => {
  assert.doesNotMatch(brewingSource, /hotWaterSettings\.reconcile|reconcileHotWater/)
  assert.match(brewingSource, /if \(hotWaterSettings\.observe\(frame\)\) setModel\(withHotWaterReadback\)/)
  assert.match(brewingSource, /isHotWater \? hotWaterSettings\.save\(update\.patch\)/)
})
