import assert from 'node:assert/strict'
import test from 'node:test'
import { COXCOMB, coxcombRadius, coxcombSector, clockPoint } from '../review/brewing-insights/coxcomb.ts'

test('coxcomb encodes count by sector area, not radius', () => {
  const area = (count: number) => coxcombRadius(count, 20) ** 2 - COXCOMB.inner ** 2
  assert.ok(Math.abs(area(10) / area(20) - .5) < 1e-10)
  assert.equal(coxcombRadius(20, 20), COXCOMB.outer)
  assert.equal(coxcombRadius(0, 20), COXCOMB.inner)
  assert.equal(coxcombRadius(0, 0), COXCOMB.inner)
  assert.equal(coxcombSector(0, coxcombRadius(0, 20)), '')
})

test('coxcomb covers 24 hours clockwise with finite equal-angle sectors', () => {
  assert.deepEqual(clockPoint(0, 100), [136, 36])
  assert.deepEqual(clockPoint(90, 100), [236, 136])
  assert.deepEqual(clockPoint(180, 100), [136, 236])
  const paths = Array.from({ length: COXCOMB.bins }, (_, i) => coxcombSector(i, 102))
  assert.equal(paths.length, 12)
  assert.equal(new Set(paths).size, 12)
  paths.forEach(path => { assert.match(path, /^M .+ Z$/); assert.doesNotMatch(path, /NaN|Infinity/) })
})
