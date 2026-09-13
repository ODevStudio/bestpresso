import type { PaginatedShots, ShotRecord } from '../../api/decaid/types.ts'
import type { PreviousShot } from '../../domain/brewing.ts'
import { attachDetail, HISTORY_LIMIT, normalizeShot, retainHistoryDetails, regroupHistory, validHistoryCache, type HistoryCache } from './historyData.ts'
import type { HistoryStorage } from './historyStorage.ts'
import { syncHistory } from './historySync.ts'

export interface HistoryState { cache: HistoryCache | null; status: 'loading' | 'ready' | 'offline'; refreshing: boolean; storageWarning: boolean; error: string | null }
interface Dependencies {
  storage: HistoryStorage; page: (offset: number) => Promise<PaginatedShots>; detail: (id: string) => Promise<ShotRecord>
  toDetail: (shot: ShotRecord) => PreviousShot; now?: () => Date
}
export class HistoryRepository {
  readonly source: string
  readonly timezone: string
  private deps: Dependencies
  state: HistoryState = { cache: null, status: 'loading', refreshing: false, storageWarning: false, error: null }
  private listeners = new Set<() => void>()
  private boot: Promise<void> | null = null
  private refreshing: Promise<void> | null = null
  private writes: Promise<void> = Promise.resolve()
  private loadingDetails = new Map<string, Promise<PreviousShot>>()
  constructor(source: string, timezone: string, dependencies: Dependencies) { this.source = source; this.timezone = timezone; this.deps = dependencies }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getSnapshot = () => this.state
  private update(patch: Partial<HistoryState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()) }
  load() {
    this.boot ??= this.deps.storage.read(this.source).then(async cache => {
      const valid = validHistoryCache(cache, this.source) ? regroupHistory(cache) : null
      this.update({ cache: valid, status: valid ? 'offline' : 'loading' })
      if (valid && valid !== cache) await this.persist(valid)
    }).catch(() => this.update({ storageWarning: true }))
    return this.boot
  }
  private persist(cache: HistoryCache) {
    this.writes = this.writes.then(() => this.deps.storage.write(cache)).catch(() => this.update({ storageWarning: true }))
    return this.writes
  }
  refresh(force = false) {
    if (this.refreshing) return this.refreshing
    this.refreshing = (async () => {
      await this.load()
      this.update({ refreshing: true })
      try {
        const next = await syncHistory(this.deps.page, this.state.cache, this.source, this.state.cache?.timezone ?? this.timezone, this.deps.now?.() ?? new Date(), force)
        const cache = retainHistoryDetails(next, this.state.cache)
        this.update({ cache, status: 'ready', error: null })
        await this.persist(cache)
      } catch (error) {
        this.update({ status: 'offline', error: error instanceof Error ? error.message : 'Decaid history is unavailable.' })
      } finally { this.update({ refreshing: false }); this.refreshing = null }
    })()
    return this.refreshing
  }
  detail(id: string) {
    const inFlight = this.loadingDetails.get(id)
    if (inFlight) return inFlight
    const operation = (async () => {
      await this.load()
      const initial = this.state.cache
      const record = initial?.records.find(r => r.id === id)
      if (!initial || !record) throw new Error(`This shot is not in the latest ${HISTORY_LIMIT.toLocaleString()} saved records. Refresh history to check again.`)
      // Summaries are reconciled on entry/refresh. A cached detail shares that revision.
      if (Object.hasOwn(initial.details, id)) return initial.details[id]
      const raw = await this.deps.detail(id)
      if (raw.id !== id || !Array.isArray(raw.measurements)) throw new Error('Decaid did not return the measurements for this shot.')
      const normalized = normalizeShot(raw, initial.timezone)
      if (!normalized) throw new Error('This saved shot is missing its date or identity.')
      const detail = this.deps.toDetail(raw)
      const current = this.state.cache
      if (current?.records.some(r => r.id === id && r.signature === record.signature)) {
        const updated = { ...current, records: current.records.map(r => r.id === id ? normalized : r) }
        const cache = attachDetail(updated, id, normalized.signature, detail)
        this.update({ cache })
        await this.persist(cache)
      }
      return detail
    })().finally(() => this.loadingDetails.delete(id))
    this.loadingDetails.set(id, operation)
    return operation
  }
}
