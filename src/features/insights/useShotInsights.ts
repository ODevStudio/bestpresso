import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { getDecaidEndpoints } from '../../api/decaid/config'
import { shotToDomain } from '../../api/decaid/adapters'
import { browserHistoryStorage } from './historyStorage'
import { HistoryRepository } from './historyRepository'
import { readHistoryDetail, readHistoryPage } from './historyTransport'
import { startLatestChartRetry, type LatestChartStatus } from './latestChartRetry'

export function useShotInsights(active: boolean, refreshKey: string) {
  const source = getDecaidEndpoints().apiBase
  const repository = useMemo(() => new HistoryRepository(source, Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', {
    storage: browserHistoryStorage(), page: offset => readHistoryPage(source, offset), detail: id => readHistoryDetail(source, id), toDetail: shotToDomain,
  }), [source])
  const state = useSyncExternalStore(repository.subscribe, repository.getSnapshot)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    void repository.load()
    if (!active) return
    const refresh = () => { setNow(new Date()); if (document.visibilityState !== 'hidden') void repository.refresh() }
    refresh()
    const interval = window.setInterval(refresh, 60000)
    // A finished shot may reach storage shortly after the live view closes.
    const settled = window.setTimeout(refresh, 4000)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.clearInterval(interval); window.clearTimeout(settled); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [repository, active, refreshKey])
  const latest = state.cache?.records.find(r => r.beverage !== 'excluded')
  const latestId = latest?.id
  const latestSignature = latest?.signature
  const latestCached = !!(latestId && state.cache?.details[latestId])
  const chartKey = `${latestId ?? ''}:${latestSignature ?? ''}`
  const [chartState, setChartState] = useState<{ key: string; status: LatestChartStatus } | null>(null)
  useEffect(() => {
    if (!active || !latestId || latestCached) return
    const retry = startLatestChartRetry({
      load: () => repository.detail(latestId),
      visible: () => document.visibilityState !== 'hidden',
      changed: status => setChartState({ key: chartKey, status }),
      schedule: (callback, delay) => {
        const timer = window.setTimeout(callback, delay)
        return () => window.clearTimeout(timer)
      },
    })
    window.addEventListener('online', retry.resume)
    document.addEventListener('visibilitychange', retry.resume)
    return () => {
      retry.stop()
      window.removeEventListener('online', retry.resume)
      document.removeEventListener('visibilitychange', retry.resume)
    }
  }, [active, repository, latestId, chartKey, latestCached])
  const latestChartStatus: LatestChartStatus = latestCached
    ? state.cache!.details[latestId!].points?.length ? 'ready' : 'empty'
    : chartState?.key === chartKey ? chartState.status : 'loading'
  return { ...state, now, repository, latestChartStatus }
}
export type ShotInsights = ReturnType<typeof useShotInsights>
