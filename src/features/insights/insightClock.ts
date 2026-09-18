import { clockOptions, type ClockFormat } from '../sleep/deviceTime.ts'
import { dateFormatter, t } from '../../i18n/index.ts'
import { shiftDate } from './historyData.ts'

// Derives the am/pm marker from Intl's own dayPeriod data instead of a hardcoded word,
// so it follows the active language automatically (CLDR uses "AM"/"PM" for en and de alike).
function meridiem(hour: number) {
  const parts = dateFormatter({ hour: 'numeric', hourCycle: 'h12', timeZone: 'UTC' }).formatToParts(new Date(Date.UTC(2024, 0, 1, hour)))
  return (parts.find(part => part.type === 'dayPeriod')?.value ?? (hour < 12 ? 'AM' : 'PM')).toLowerCase()
}
export function insightHour(hour: number, format: ClockFormat, minor = false, locales?: Intl.LocalesArgument) {
  const twelve = new Intl.DateTimeFormat(locales, { hour: 'numeric', ...clockOptions(format) }).resolvedOptions().hour12
  const normalized = ((hour % 24) + 24) % 24
  return twelve ? `${normalized % 12 || 12}${minor ? '' : ` ${meridiem(normalized)}`}` : String(normalized)
}
export const insightHourRange = (index: number, format: ClockFormat) =>
  `${insightHour(index * 2, format)}–${insightHour(index * 2 + 2, format)}`
/** Use the same exclusive-end windows as the charts, not dates of available shots. */
export function insightPeriods(current: { start: string; end: string }, previous: { start: string; end: string }): [string, string] {
  const windows = [current, previous].map(window => ({ start: window.start, end: shiftDate(window.end, -1) }))
  const showYear = new Set(windows.flatMap(window => [window.start.slice(0, 4), window.end.slice(0, 4)])).size > 1
  // Month name in its day-month form ("Sep" / "Sept."); the day-month order comes from the catalog.
  const month = (date: string) => dateFormatter({ day: 'numeric', month: 'short', timeZone: 'UTC' }).formatToParts(new Date(`${date}T12:00:00Z`)).find(part => part.type === 'month')?.value ?? ''
  const full = (date: string) => `${t('insights.period.dayMonth', { day: Number(date.slice(8, 10)), month: month(date) })}${showYear ? ` ${date.slice(0, 4)}` : ''}`
  return windows.map(({ start, end }) => start === end ? full(start)
    : start.slice(0, 7) === end.slice(0, 7) ? `${t('insights.period.dayOnly', { day: Number(start.slice(8, 10)) })}–${full(end)}`
      : `${full(start)}–${full(end)}`) as [string, string]
}
export const toggleHour = (selected: number | null, index: number) => selected === index ? null : index
