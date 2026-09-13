import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { getDecaidEndpoints } from '../../api/decaid/config'
import { shotToDomain } from '../../api/decaid/adapters'
import { browserHistoryStorage } from './historyStorage'
import { HistoryRepository } from './historyRepository'
import { readHistoryDetail, readHistoryPage } from './historyTransport'

export function useShotInsights(active: boolean, refreshKey: string) {
  const source = getDecaidEndpoints().apiBase
  const repository = useMemo(() => new HistoryRepository(source, Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', {
    storage: browserHistoryStorage(), page: () => readHistoryPage(source), detail: id => readHistoryDetail(source, id), toDetail: shotToDomain,
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
  useEffect(() => {
    if (active && state.status === 'ready' && latestId && !latestCached) void repository.detail(latestId).catch(() => undefined)
  }, [active, repository, state.status, latestId, latestSignature, latestCached]) // one thumbnail, never every history curve
  return { ...state, now, repository }
}
export type ShotInsights = ReturnType<typeof useShotInsights>
