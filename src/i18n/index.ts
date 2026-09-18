import { useEffect, useState } from 'react'
import { de } from './de/index.ts'
import { en, type EnglishCatalog } from './en/index.ts'
import type { PluralMessage, Translation } from './types.ts'

export type Language = 'en' | 'de'
export type LanguagePreference = 'auto' | Language
export const LANGUAGES: readonly Language[] = ['en', 'de']

const catalogs: Record<Language, Translation<EnglishCatalog>> = { en, de }
const defaultRegion: Record<Language, string> = { en: 'en-US', de: 'de-DE' }
const languageEvent = 'bestpresso:language-changed'

type Catalog = EnglishCatalog
export type MessageKey = { [Key in keyof Catalog]: Catalog[Key] extends string ? Key : never }[keyof Catalog]
export type PluralKey = { [Key in keyof Catalog]: Catalog[Key] extends PluralMessage ? Key : never }[keyof Catalog]

type PlaceholderNames<Text> = Text extends `${string}{${infer Name}}${infer Rest}` ? Name | PlaceholderNames<Rest> : never
type Params<Text> = [PlaceholderNames<Text>] extends [never] ? [] : [params: Record<PlaceholderNames<Text>, string | number>]
type PluralParams<Entry> = Entry extends PluralMessage ? Exclude<PlaceholderNames<Entry['one']> | PlaceholderNames<Entry['other']>, 'count'> : never

let active: Language = 'en'
let activeLocale = defaultRegion.en

const browserLanguages = (): readonly string[] => {
  if (typeof navigator === 'undefined') return []
  return navigator.languages?.length ? navigator.languages : navigator.language ? [navigator.language] : []
}

const isLanguage = (value: string): value is Language => (LANGUAGES as readonly string[]).includes(value)

/** `auto` follows the first device language Bestpresso supports; anything else falls back to English. */
export function resolveLanguage(preference: LanguagePreference = 'auto', languages: readonly string[] = browserLanguages()): Language {
  if (preference !== 'auto') return preference
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLanguage(base)) return base
  }
  return 'en'
}

/** Keeps the device region when it matches the language (de-CH, en-GB), so numbers and dates follow it. */
export function localeFor(language: Language, languages: readonly string[] = browserLanguages()) {
  return languages.find(tag => tag.toLowerCase().split('-')[0] === language && tag.includes('-')) ?? defaultRegion[language]
}

export function setActiveLanguage(language: Language, languages: readonly string[] = browserLanguages()) {
  const changed = language !== active
  active = language
  activeLocale = localeFor(language, languages)
  decimalSeparatorCache = undefined
  if (typeof document !== 'undefined') document.documentElement.lang = language
  if (changed && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(languageEvent, { detail: language }))
}

export const activeLanguage = () => active
export const activeLocaleTag = () => activeLocale

const pseudoEnabled = () => {
  try {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('i18n-pseudo')
  } catch {
    return false
  }
}

const pseudoMap: Record<string, string> = { a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü', A: 'Ä', E: 'Ë', I: 'Ï', O: 'Ö', U: 'Ü' }

/** Test-only pseudo locale: accented, ~35% longer and bracketed, so untranslated or clipped text stands out. */
export function pseudoLocalize(text: string) {
  const accented = text.replace(/\{[^}]+\}|[aeiouAEIOU]/g, match => pseudoMap[match] ?? match)
  const padding = '·'.repeat(Math.ceil(text.length * 0.35))
  return `⟦${accented}${padding}⟧`
}

const interpolate = (template: string, params?: Record<string, string | number>) => params
  ? template.replace(/\{(\w+)\}/g, (match, name: string) => name in params ? String(params[name]) : match)
  : template

const finish = (text: string) => pseudoEnabled() ? pseudoLocalize(text) : text

/** Translate a message into the active language. Placeholders are typed from the English source text. */
export function t<Key extends MessageKey>(key: Key, ...[params]: Params<Catalog[Key]>): string {
  const message = catalogs[active][key] ?? en[key]
  return finish(interpolate(message as string, params as Record<string, string | number> | undefined))
}

/** Translate a one/other message; `{count}` receives the formatted number. */
export function plural<Key extends PluralKey>(key: Key, count: number, ...[params]: [PluralParams<Catalog[Key]>] extends [never] ? [] : [params: Record<PluralParams<Catalog[Key]>, string | number>]): string {
  const entry = (catalogs[active][key] ?? en[key]) as PluralMessage
  let category = count === 1 ? 'one' : 'other'
  try {
    category = new Intl.PluralRules(activeLocale).select(count) === 'one' ? 'one' : 'other'
  } catch {
    // Older WebViews without PluralRules keep the English/German one-vs-other rule above.
  }
  const template = category === 'one' ? entry.one : entry.other
  return finish(interpolate(template, { ...(params as Record<string, string | number> | undefined), count: formatNumber(count) }))
}

let decimalSeparatorCache: string | undefined

/** Decimal separator of the active locale: "," for de-DE, "." for en and de-CH. */
export function decimalSeparator() {
  if (decimalSeparatorCache !== undefined) return decimalSeparatorCache
  let separator = '.'
  try {
    separator = new Intl.NumberFormat(activeLocale).formatToParts(1.5).find(part => part.type === 'decimal')?.value ?? '.'
  } catch {
    separator = active === 'de' ? ',' : '.'
  }
  decimalSeparatorCache = separator
  return separator
}

/**
 * Drop-in for `value.toFixed(digits)` in displayed text: same rounding and no grouping, with the
 * locale's decimal separator. Keep plain `toFixed` for values sent to Decaid or used as keys.
 */
export function formatDecimal(value: number, digits = 0) {
  const fixed = value.toFixed(digits)
  const separator = decimalSeparator()
  return separator === '.' ? fixed : fixed.replace('.', separator)
}

/**
 * Display-only: model values such as grind `14.5` or flow `0.6` are kept as dot-decimal strings because they
 * are parsed again; show them with the locale's separator without touching the stored value.
 */
export function localizeDecimalText(text: string) {
  const separator = decimalSeparator()
  return separator === '.' ? text : text.replace(/(\d)\.(\d)/g, `$1${separator}$2`)
}

/** Localised number with grouping (`1,234` / `1.234`), replacing `toLocaleString()` in displayed text. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  try {
    return new Intl.NumberFormat(activeLocale, options).format(value)
  } catch {
    return String(value)
  }
}

/** Parses user-typed numbers that may use the locale's decimal comma. */
export function parseLocalizedNumber(text: string) {
  const separator = decimalSeparator()
  return Number(separator === '.' ? text : text.replace(separator, '.'))
}

/** Localised date/time formatter for the active language (month and weekday names follow it). */
export function dateFormatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(activeLocale, options)
}

/** Re-renders a component when the language changes; components that are not memoised follow the app shell. */
export function useLanguage() {
  const [language, setLanguage] = useState(active)
  useEffect(() => {
    const onChange = () => setLanguage(active)
    window.addEventListener(languageEvent, onChange)
    return () => window.removeEventListener(languageEvent, onChange)
  }, [])
  return language
}

export const hasMessage = (key: string): key is MessageKey => key in en
