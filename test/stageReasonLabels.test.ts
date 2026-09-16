import assert from 'node:assert/strict'
import test from 'node:test'
import { stageReasonLabels } from '../src/features/brew/stageReasonLabels.ts'

test('retains reached for a single condition and shares it across alternatives', () => {
  assert.deepEqual(stageReasonLabels('Pressure >7 bar reached'), ['Pressure >7 bar reached'])
  assert.deepEqual(stageReasonLabels('Time limit reached or Flow <2.5 ml/s reached'), ['Time limit', 'Flow <2.5 ml/s reached'])
  assert.deepEqual(stageReasonLabels('Stage yield reached'), ['Stage yield reached'])
  assert.deepEqual(stageReasonLabels('Time limit reached or Pressure >4 bar reached'), ['Time limit', 'Pressure >4 bar reached'])
  assert.deepEqual(stageReasonLabels('Time limit reached or Pressure >4 bar reached or Flow <2 ml/s reached'), ['Time limit', 'Pressure >4 bar', 'Flow <2 ml/s reached'])
})

test('manual and unknown reasons remain separate from reached conditions', () => {
  assert.deepEqual(stageReasonLabels('Stage yield reached or Manually advanced'), ['Stage yield reached', 'Manual advance'])
  assert.deepEqual(stageReasonLabels('Manually advanced or Stage yield reached'), ['Manual advance', 'Stage yield reached'])
  assert.deepEqual(stageReasonLabels('Manually stopped'), ['Manual stop'])
  assert.deepEqual(stageReasonLabels(), ['Unknown'])
})
