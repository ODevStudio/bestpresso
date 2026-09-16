import { clockOptions, type ClockFormat } from '../sleep/deviceTime.ts'
import { shiftDate } from './historyData.ts'

export function insightHour(hour: number, format: ClockFormat, minor = false, locales?: Intl.LocalesArgument) {
  const twelve = new Intl.DateTimeFormat(locales, { hour: 'numeric', ...clockOptions(format) }).resolvedOptions().hour12
  const normalized = ((hour % 24) + 24) % 24
  return twelve ? `${normalized % 12 || 12}${minor ? '' : normalized < 12 ? ' am' : ' pm'}` : String(normalized)
}
export const insightHourRange = (index: number, format: ClockFormat) =>
  `${insightHour(index * 2, format)}–${insightHour(index * 2 + 2, format)}`
/** Use the same exclusive-end windows as the charts, not dates of available shots. */
export function insightPeriods(current: { start: string; end: string }, previous: { start: string; end: string }): [string, string] {
  const windows = [current, previous].map(window => ({ start: window.start, end: shiftDate(window.end, -1) }))
  const showYear = new Set(windows.flatMap(window => [window.start.slice(0, 4), window.end.slice(0, 4)])).size > 1
  const month = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
  const full = (date: string) => `${Number(date.slice(8, 10))} ${month(date)}${showYear ? ` ${date.slice(0, 4)}` : ''}`
  return windows.map(({ start, end }) => start === end ? full(start)
    : start.slice(0, 7) === end.slice(0, 7) ? `${Number(start.slice(8, 10))}–${full(end)}`
      : `${full(start)}–${full(end)}`) as [string, string]
}
export const toggleHour = (selected: number | null, index: number) => selected === index ? null : index
