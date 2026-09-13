import { clockOptions, type ClockFormat } from '../sleep/deviceTime.ts'

export function insightHour(hour: number, format: ClockFormat, minor = false, locales?: Intl.LocalesArgument) {
  const twelve = new Intl.DateTimeFormat(locales, { hour: 'numeric', ...clockOptions(format) }).resolvedOptions().hour12
  const normalized = ((hour % 24) + 24) % 24
  return twelve ? `${normalized % 12 || 12}${minor ? '' : normalized < 12 ? ' am' : ' pm'}` : String(normalized)
}
export const insightHourRange = (index: number, format: ClockFormat) =>
  `${insightHour(index * 2, format)}–${insightHour(index * 2 + 2, format)}`
export const insightPeriods = (days: number) => [`Last ${days} days`, `Previous ${days} days`]
export const toggleHour = (selected: number | null, index: number) => selected === index ? null : index
