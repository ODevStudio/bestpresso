import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { en } from '../src/i18n/en/index.ts'
import { languageRegistry, matchLanguage } from '../src/i18n/registry.ts'
import { activeLocaleTag, dateFormatter, decimalSeparator, formatDecimal, formatNumber, localeFor, parseLocalizedNumber, plural, resolveLanguage, setActiveLanguage, t } from '../src/i18n/index.ts'
import { insightHour, insightPeriods } from '../src/features/insights/insightClock.ts'
import { validateCatalog } from '../src/i18n/validation.ts'

const added = ['fr', 'it', 'zh-Hant', 'zh-Hans'] as const

test('partial source imports preserve blanks and track every reused token', async () => {
  const provenance = JSON.parse(readFileSync(new URL('../docs/streamline-translation-provenance.json', import.meta.url), 'utf8'))
  const pending = JSON.parse(readFileSync(new URL('../docs/localisation-pending.json', import.meta.url), 'utf8'))
  for (const language of added) {
    const catalog = await languageRegistry[language].load()
    assert.deepEqual(validateCatalog(en, catalog, languageRegistry[language].locale), [])
    assert.equal(Object.keys(catalog).length, language.startsWith('zh') ? 130 : 145)
    for (const [key, value] of Object.entries(catalog)) {
      assert.ok(value)
      assert.equal(provenance.entries[key].english, en[key as keyof typeof en])
      assert.ok(provenance.entries[key].languages.includes(language))
      assert.ok(provenance.entries[key].row > 1)
    }
    assert.equal('library.field.source' in catalog, false)
    assert.equal('brew.liveScreen.timerLabel' in catalog, false)
    assert.equal(pending['library.field.source'][language], '')
    await setActiveLanguage(language, [])
    assert.equal(t('library.field.source'), en['library.field.source'])
    assert.equal(plural('insights.common.brewsPct', 1, { pct: 50 }), '1 brew · 50%')
    assert.equal(plural('insights.common.brewsPct', 2, { pct: 50 }), '2 brews · 50%')
  }
  await setActiveLanguage('en', ['en-US'])
})

test('Chinese script matching respects explicit script, regions and older WebViews', () => {
  const cases = { 'zh': 'zh-Hans', 'zh-CN': 'zh-Hans', 'zh-SG': 'zh-Hans', 'zh-TW': 'zh-Hant', 'zh-HK': 'zh-Hant', 'zh-MO': 'zh-Hant', 'zh-Hant-CN': 'zh-Hant', 'zh-Hans-TW': 'zh-Hans' } as const
  for (const [tag, code] of Object.entries(cases)) assert.equal(resolveLanguage('auto', [tag]), code)
  const original = Object.getOwnPropertyDescriptor(Intl, 'Locale')!
  try {
    Object.defineProperty(Intl, 'Locale', { configurable: true, value: undefined })
    for (const [tag, code] of Object.entries(cases)) assert.equal(matchLanguage(tag, languageRegistry), code)
    assert.equal(resolveLanguage('auto', ['fr-CA']), 'fr')
    assert.equal(resolveLanguage('auto', ['it-CH']), 'it')
  } finally { Object.defineProperty(Intl, 'Locale', original) }
  assert.equal(localeFor('fr', ['fr-CA']), 'fr-CA')
  assert.equal(localeFor('it', ['it-CH']), 'it-CH')
  assert.equal(localeFor('zh-Hant', ['zh-HK']), 'zh-HK')
  assert.equal(localeFor('zh-Hans', ['zh-SG']), 'zh-SG')
  assert.equal(localeFor('zh-Hant', ['zh-CN']), 'zh-TW')
})

test('regional number display and input do not alter numeric storage', async () => {
  const cases = [['fr', 'fr-FR'], ['fr', 'fr-CA'], ['it', 'it-IT'], ['it', 'it-CH'], ['zh-Hant', 'zh-TW'], ['zh-Hant', 'zh-HK'], ['zh-Hans', 'zh-CN'], ['zh-Hans', 'zh-SG']] as const
  for (const [language, locale] of cases) {
    await setActiveLanguage(language, [locale])
    assert.equal(activeLocaleTag(), locale)
    assert.equal(formatNumber(12345.6), new Intl.NumberFormat(locale).format(12345.6))
    const text = formatDecimal(18.5, 1)
    assert.equal(text, new Intl.NumberFormat(locale, { useGrouping: false, minimumFractionDigits: 1 }).format(18.5))
    assert.equal(parseLocalizedNumber(text), 18.5)
    assert.equal(JSON.stringify({ dose: parseLocalizedNumber(text) }), '{"dose":18.5}')
    assert.equal(decimalSeparator(), ['fr-FR', 'fr-CA', 'it-IT'].includes(locale) ? ',' : '.')
    assert.ok(Number.isNaN(parseLocalizedNumber('1,234.5')))
  }
  await setActiveLanguage('en', ['en-US'])
})

test('partial locales use native date ranges including cross-year and old-WebView fallback', async () => {
  const windows = [{ start: '2026-09-12', end: '2026-09-19' }, { start: '2026-09-05', end: '2026-09-12' }] as const
  for (const language of added) {
    await setActiveLanguage(language, [])
    const locale = languageRegistry[language].locale
    const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
    assert.equal(insightPeriods(...windows)[0], formatter.formatRange(new Date('2026-09-12T12:00Z'), new Date('2026-09-18T12:00Z')))
    assert.equal(dateFormatter({ dateStyle: 'short', timeZone: 'UTC' }).format(new Date('2026-09-19T12:00Z')), new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeZone: 'UTC' }).format(new Date('2026-09-19T12:00Z')))
    const crossYear = insightPeriods({ start: '2025-12-29', end: '2026-01-05' }, { start: '2025-12-22', end: '2025-12-29' })
    assert.match(crossYear[0], /2025/)
    assert.match(crossYear[0], /2026/)
    const original = Object.getOwnPropertyDescriptor(Intl.DateTimeFormat.prototype, 'formatRange')!
    try {
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'formatRange', { configurable: true, value: undefined })
      assert.equal(insightPeriods(...windows)[0], `${formatter.format(new Date('2026-09-12T12:00Z'))}–${formatter.format(new Date('2026-09-18T12:00Z'))}`)
    } finally { Object.defineProperty(Intl.DateTimeFormat.prototype, 'formatRange', original) }
  }
  await setActiveLanguage('en', ['en-US'])
})

test('hour labels respect Chinese day-period order and independent clock preference', async () => {
  for (const language of added) {
    await setActiveLanguage(language, [])
    for (const hour of [0, 6, 12, 15, 18, 21]) {
      const expected = new Intl.DateTimeFormat(languageRegistry[language].locale, { hour: 'numeric', hourCycle: 'h12', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1, hour))).toLowerCase().replace(/[\u00a0\u202f]/g, ' ')
      assert.equal(insightHour(hour, '12h'), expected)
      assert.equal(insightHour(hour, '24h'), String(hour))
      assert.equal(insightHour(hour, '12h', true), String(hour % 12 || 12))
      assert.equal(insightHour(hour, 'device', false, 'en-US'), expected)
      assert.equal(insightHour(hour, 'device', false, 'en-GB'), String(hour))
    }
  }
  await setActiveLanguage('en', ['en-US'])
})
