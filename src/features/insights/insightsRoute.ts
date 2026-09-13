import type { InsightFilter } from './historyData.ts'

export interface InsightsRoute { section: 'overview' | 'history'; days: 0 | 7 | 28; beverage: 'espresso' | 'pourover' | 'other' | 'all'; filter: InsightFilter; search: string; previous: boolean; shotId: string | null }
export const defaultInsightsRoute: InsightsRoute = { section: 'overview', days: 7, beverage: 'espresso', filter: null, search: '', previous: false, shotId: null }
const keys = ['insSection', 'insDays', 'insDrink', 'insKind', 'insValue', 'insSearch', 'insPrevious', 'shotId']
export function readInsightsRoute(params: URLSearchParams): InsightsRoute {
  const section = params.get('insSection') === 'history' || params.get('page') === 'previous-pull' ? 'history' : 'overview'
  const days = params.get('insDays') === '28' ? 28 : section === 'history' && params.get('insDays') === '0' ? 0 : 7
  const drink = params.get('insDrink')
  const kind = params.get('insKind')
  const value = params.get('insValue')
  const filter: InsightFilter = value && (kind === 'profile' || kind === 'weekday' && /^[0-6]$/.test(value) || kind === 'hours' && /^(?:[0-9]|1[01])$/.test(value)) ? { kind: kind as NonNullable<InsightFilter>['kind'], value } : null
  return { section, days, beverage: drink === 'pourover' || drink === 'other' || (section === 'history' && drink === 'all') ? drink : 'espresso', filter, search: params.get('insSearch') ?? '', previous: section === 'history' && days !== 0 && params.get('insPrevious') === '1', shotId: params.get('shotId') }
}
export function writeInsightsRoute(url: URL, route: InsightsRoute) {
  keys.forEach(key => url.searchParams.delete(key))
  url.searchParams.set('page', 'insights')
  url.searchParams.set('insSection', route.section)
  url.searchParams.set('insDays', String(route.days))
  url.searchParams.set('insDrink', route.beverage)
  if (route.filter) { url.searchParams.set('insKind', route.filter.kind); url.searchParams.set('insValue', route.filter.value) }
  if (route.search) url.searchParams.set('insSearch', route.search)
  if (route.previous) url.searchParams.set('insPrevious', '1')
  if (route.shotId) url.searchParams.set('shotId', route.shotId)
  return url
}
