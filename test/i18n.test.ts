import assert from 'node:assert/strict'
import test from 'node:test'
import { areas as germanAreas, de } from '../src/i18n/de/index.ts'
import { areas as englishAreas, en } from '../src/i18n/en/index.ts'
import { decimalSeparator, formatDecimal, formatNumber, localeFor, plural, pseudoLocalize, resolveLanguage, setActiveLanguage, t } from '../src/i18n/index.ts'
import { normalizeBestpressoPreferences } from '../src/features/settings/bestpressoPreferences.ts'

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
const texts = (entry: unknown): string[] => typeof entry === 'string' ? [entry] : Object.values(entry as Record<string, string>)

test('every area keeps its keys under its own prefix, so merged catalogs cannot overwrite each other', () => {
  const seen = new Set<string>()
  for (const [area, catalog] of Object.entries(englishAreas)) {
    for (const key of Object.keys(catalog)) {
      assert.ok(key.startsWith(`${area}.`), `${key} belongs in the ${area} area`)
      assert.ok(!seen.has(key), `duplicate key ${key}`)
      seen.add(key)
    }
  }
  assert.equal(seen.size, Object.keys(en).length)
})

test('German translates exactly the English keys with the same placeholders and no empty text', () => {
  assert.deepEqual(Object.keys(de).sort(), Object.keys(en).sort())
  for (const [area, catalog] of Object.entries(germanAreas)) assert.deepEqual(Object.keys(catalog).sort(), Object.keys(englishAreas[area as keyof typeof englishAreas]).sort(), area)
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    const source = en[key] as unknown
    const target = de[key] as unknown
    assert.equal(typeof target, typeof source, key)
    const sourceTexts = texts(source)
    const targetTexts = texts(target)
    for (const text of targetTexts) assert.ok(text.trim().length > 0, `${key} is empty`)
    assert.deepEqual([...new Set(targetTexts.flatMap(placeholders))].sort(), [...new Set(sourceTexts.flatMap(placeholders))].sort(), `${key} placeholders`)
  }
})

test('auto follows the first supported device language and falls back to English', () => {
  assert.equal(resolveLanguage('auto', ['de-DE', 'en-US']), 'de')
  assert.equal(resolveLanguage('auto', ['de-CH']), 'de')
  assert.equal(resolveLanguage('auto', ['fr-FR', 'de-AT']), 'de')
  assert.equal(resolveLanguage('auto', ['fr-FR']), 'en')
  assert.equal(resolveLanguage('auto', []), 'en')
  assert.equal(resolveLanguage('en', ['de-DE']), 'en')
  assert.equal(resolveLanguage('de', ['en-US']), 'de')
  assert.equal(localeFor('de', ['de-CH', 'en-US']), 'de-CH')
  assert.equal(localeFor('de', ['en-US']), 'de-DE')
  assert.equal(localeFor('en', ['de-DE']), 'en-US')
})

test('the language preference defaults to auto and rejects unknown values', () => {
  assert.equal(normalizeBestpressoPreferences(undefined).language, 'auto')
  assert.equal(normalizeBestpressoPreferences({ language: 'de' }).language, 'de')
  assert.equal(normalizeBestpressoPreferences({ language: 'fr' }).language, 'auto')
})

test('German uses the decimal comma without changing toFixed rounding; English output is unchanged', () => {
  setActiveLanguage('en', ['en-US'])
  assert.equal(formatDecimal(36.25, 1), (36.25).toFixed(1))
  assert.equal(formatDecimal(9.5), '10')
  assert.equal(formatNumber(1234), '1,234')
  setActiveLanguage('de', ['de-DE'])
  assert.equal(decimalSeparator(), ',')
  assert.equal(formatDecimal(36.5, 1), '36,5')
  assert.equal(formatDecimal(-0.04, 1), '-0,0')
  assert.equal(formatNumber(1234), '1.234')
  setActiveLanguage('de', ['de-CH'])
  assert.equal(formatDecimal(36.5, 1), '36.5')
  setActiveLanguage('en', ['en-US'])
})

test('messages switch language at runtime and fill placeholders', () => {
  setActiveLanguage('de', ['de-DE'])
  assert.equal(t('common.metric.flow'), 'Durchfluss')
  assert.equal(t('common.language.auto', { language: 'Deutsch' }), 'Wie Gerät (Deutsch)')
  setActiveLanguage('en', ['en-US'])
  assert.equal(t('common.metric.flow'), 'Flow')
  assert.equal(typeof plural, 'function')
})

test('pseudo localisation keeps placeholders intact and makes text longer', () => {
  const pseudo = pseudoLocalize('Stage {n} of {total}')
  assert.match(pseudo, /\{n\}/)
  assert.match(pseudo, /\{total\}/)
  assert.ok(pseudo.length > 'Stage {n} of {total}'.length * 1.3)
})
