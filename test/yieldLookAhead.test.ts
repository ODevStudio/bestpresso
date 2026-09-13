import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { hotWaterWeightStoppingPatch } from '../src/features/settings/yieldLookAhead.ts'

test('scale connection enables weight stopping without overwriting either calibration', () => {
  for (const hotWaterFlowMultiplier of [0, 0.3, 0.7, 1]) {
    const settings = { weightFlowMultiplier: 1, hotWaterFlowMultiplier, stopHotWaterAtWeight: false }
    assert.deepEqual(hotWaterWeightStoppingPatch(settings), { stopHotWaterAtWeight: true })
    assert.deepEqual(hotWaterWeightStoppingPatch({ ...settings, stopHotWaterAtWeight: true }), {})
    assert.equal(settings.hotWaterFlowMultiplier, hotWaterFlowMultiplier)
  }
  assert.deepEqual(hotWaterWeightStoppingPatch({}), { stopHotWaterAtWeight: true })
})

test('settings save changes only requested fields and exposes independent hot-water calibration', () => {
  const save = readFileSync(new URL('../src/features/settings/useUnifiedSettings.ts', import.meta.url), 'utf8')
  assert.match(save, /const rea = changedFields\(baseline.rea, draft.rea\)/)
  assert.doesNotMatch(save, /hotWaterYieldLookAheadPatch|hotWaterFlowMultiplier/)
  const screen = readFileSync(new URL('../src/features/settings/SettingsScreen.tsx', import.meta.url), 'utf8')
  assert.match(screen, /label="Espresso yield"/)
  assert.match(screen, /label="Hot-water yield"/)
  assert.match(screen, /label="Hot-water yield"[^\n]*step=\{0\.05\} digits=\{2\}/)
  assert.match(screen, /patchRea\(\{ hotWaterFlowMultiplier \}\)/)
  assert.match(screen, /patchRea\(\{ hotWaterFlowMultiplier: 0\.3 \}\)/)
})
