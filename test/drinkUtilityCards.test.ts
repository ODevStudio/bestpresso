import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { applyWorkflow } from '../src/api/decaid/adapters.ts'
import type { BrewingScreenModel } from '../src/domain/brewing.ts'
import { VALUE_ADJUSTMENTS } from '../src/domain/valueAdjustments.ts'
import { SETTINGS_PROTOCOL } from '../src/features/settings/settingsProtocol.ts'

const model = { profiles: [], utilities: [
  { id: 'water', label: 'Hot water', metrics: [{ label: 'Volume', value: '50', unit: 'ml' }, { label: 'Temperature', value: '92', unit: '°' }] },
  { id: 'steam', label: 'Steam', enabled: true, metrics: [{ label: 'Current', value: '45', unit: '°' }, { label: 'Target', value: '160', unit: '°' }, { label: 'Duration', value: '50', unit: 's' }, { label: 'Flow', value: '0.7', unit: 'ml/s' }] },
] } as BrewingScreenModel
const water = (value: BrewingScreenModel) => Object.fromEntries(value.utilities[0].metrics.map(m => [m.label, m.value]))

test('adds max duration to an older two-metric hot-water model from the workflow', () => {
  const updated = applyWorkflow(model, { hotWaterData: { duration: 35 } }, [])
  assert.deepEqual(water(updated), { Volume: '50', Temperature: '92', 'Max duration': '35' })
  assert.equal(model.utilities[0].metrics.length, 2)
  assert.equal(applyWorkflow(updated, { hotWaterData: { duration: 40 } }, []).utilities[0].metrics.length, 3)
})

test('partial workflow refreshes keep independent hot-water values and preserve zero', () => {
  const updated = applyWorkflow(model, { hotWaterData: { volume: 70, targetTemperature: 60, duration: 30 } }, [])
  assert.deepEqual(water(applyWorkflow(updated, { hotWaterData: { duration: 0 } }, [])), { Volume: '70', Temperature: '60', 'Max duration': '0' })
  assert.deepEqual(water(applyWorkflow(updated, {}, [])), water(updated))
})

test('steam on/off preserves target, flow, duration, and actual heater reading', () => {
  const off = applyWorkflow(model, { steamSettings: { targetTemperature: 0 } }, [])
  assert.equal(off.utilities[1].enabled, false)
  assert.deepEqual(off.utilities[1].metrics, model.utilities[1].metrics)
  const on = applyWorkflow(off, { steamSettings: { targetTemperature: 160 } }, [])
  assert.equal(on.utilities[1].enabled, true)
  assert.deepEqual(on.utilities[1].metrics, model.utilities[1].metrics)
})

test('home hot-water max duration uses the same adjustment range as Settings', () => {
  const { min, max, step } = VALUE_ADJUSTMENTS.hotWaterDuration
  assert.deepEqual({ min, max, step }, SETTINGS_PROTOCOL.hotWater.duration)
})

test('collapsed cards keep their original summaries and hidden controls cannot receive focus', () => {
  const source = readFileSync(new URL('../src/features/machine/DrinkUtilityCard.tsx', import.meta.url), 'utf8')
  assert.match(source, /\['Volume', 'Temperature'\]\.map\(metric\)/)
  assert.match(source, /inert=\{!compact\} aria-hidden=\{!compact\}/)
  assert.match(source, /inert=\{compact\} aria-hidden=\{compact\}/)
  assert.match(source, /displayMetric\('Duration', 'Max duration'\)/)
  assert.match(source, /displayMetric\('Max duration'\)/)
  assert.match(source, /metric__edit-indicator/)
})

test('motion uses CSS interpolation, the shared 520ms card timing, and reduced-motion support', () => {
  const css = readFileSync(new URL('../src/features/machine/drinkUtilityCards.css', import.meta.url), 'utf8')
  assert.match(css, /--drink-motion:\.52s/)
  assert.match(css, /--drink-ease:cubic-bezier\(\.22,\.72,\.28,1\)/)
  assert.match(css, /stroke-dashoffset \.24s linear/)
  assert.match(css, /transition:opacity \.38s \.14s ease/)
  assert.match(css, /prefers-reduced-motion:reduce/)
  assert.match(css, /\.drink-card__compact \.utility-card__metrics \{margin:0\}/)
  assert.match(css, /inset:50px 0 8px;row-gap:4px/)
  const digits = readFileSync(new URL('../src/features/machine/TemperatureReading.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(digits, /requestAnimationFrame|setInterval/)
})
