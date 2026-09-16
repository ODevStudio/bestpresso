import assert from 'node:assert/strict'
import test from 'node:test'
import { stageReasonLabels } from '../src/features/brew/stageReasonLabels.ts'

test('retains reached for a single condition and shares it across alternatives', () => {
  assert.deepEqual(stageReasonLabels('Stage yield reached'), ['Stage yield reached'])
  assert.deepEqual(stageReasonLabels('Time limit reached or Pressure threshold reached'), ['Time limit', 'Pressure threshold reached'])
  assert.deepEqual(stageReasonLabels('Time limit reached or Pressure threshold reached or Flow threshold reached'), ['Time limit', 'Pressure threshold', 'Flow threshold reached'])
})

test('manual and unknown reasons remain separate from reached conditions', () => {
  assert.deepEqual(stageReasonLabels('Stage yield reached or Manually advanced'), ['Stage yield reached', 'Manual advance'])
  assert.deepEqual(stageReasonLabels('Manually advanced or Stage yield reached'), ['Manual advance', 'Stage yield reached'])
  assert.deepEqual(stageReasonLabels('Manually stopped'), ['Manual stop'])
  assert.deepEqual(stageReasonLabels(), ['Unknown'])
})
