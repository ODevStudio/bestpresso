import type { PaginatedShots, ShotRecord } from '../../api/decaid/types.ts'
import type { PreviousShot } from '../../domain/brewing.ts'
import { attachDetail, HISTORY_LIMIT, normalizeShot, retainHistoryDetails, regroupHistory, reconcileCachedDurations, savedDuration, validHistoryCache, type HistoryCache } from './historyData.ts'
import type { HistoryStorage } from './historyStorage.ts'
import { syncHistory } from './historySync.ts'
import { reconcileStageReasons, STAGE_REASON_VERSION } from '../brew/stageMoveOn.ts'

export interface HistoryState { cache: HistoryCache | null; status: 'loading' | 'ready' | 'offline'; refreshing: boolean; storageWarning: boolean; error: string | null }
interface Dependencies {
  storage: HistoryStorage; page: (offset: number) => Promise<PaginatedShots>; detail: (id: string) => Promise<ShotRecord>
  toDetail: (shot: ShotRecord) => PreviousShot; now?: () => Date
  decorateDetail?: (shot: PreviousShot) => PreviousShot
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
  private rawDetails = new Map<string, Promise<ShotRecord>>()
  private durationBatch: Promise<boolean> | null = null
  private stageBatch: Promise<boolean> | null = null
  constructor(source: string, timezone: string, dependencies: Dependencies) { this.source = source; this.timezone = timezone; this.deps = dependencies }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getSnapshot = () => this.state
  private update(patch: Partial<HistoryState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()) }
  load() {
    this.boot ??= this.deps.storage.read(this.source).then(async cache => {
      const valid = validHistoryCache(cache, this.source) ? reconcileCachedDurations(regroupHistory(cache)) : null
      this.update({ cache: valid, status: valid ? 'offline' : 'loading' })
      if (valid && valid !== cache) await this.persist(valid)
    }).catch(() => this.update({ storageWarning: true }))
    return this.boot
  }
  private persist(cache: HistoryCache) {
    this.writes = this.writes.then(() => this.deps.storage.write(cache)).catch(() => this.update({ storageWarning: true }))
    return this.writes
  }
  private reconcileDetail(detail: PreviousShot, signature?: string) {
    return reconcileStageReasons(this.deps.decorateDetail?.(detail) ?? detail, signature)
  }
  // Offline-only migration: small resumable batches, no graph downloads. Missing
  // detail records remain eligible when their measurements are fetched later.
  reconcileStageReasonBatch(canContinue: () => boolean = () => true): Promise<boolean> {
    if (this.stageBatch) return this.stageBatch
    this.stageBatch = (async () => {
      await this.load()
      const current = this.state.cache
      if (!current) return true
      const needsReconciliation = (detail: PreviousShot | undefined) => detail?.points?.length && (this.deps.decorateDetail?.(detail) ?? detail).stageReasons?.version !== STAGE_REASON_VERSION
      const pending = current.records.filter(r => needsReconciliation(current.details[r.id])).slice(0, 5)
      const details = { ...current.details }
      let changed = false
      for (const record of pending) {
        if (!canContinue()) break
        details[record.id] = this.reconcileDetail(details[record.id], record.signature)
        changed = true
      }
      if (changed) {
        const cache = { ...current, details }
        this.update({ cache })
        await this.persist(cache)
      }
      return !this.state.cache?.records.some(r => needsReconciliation(this.state.cache!.details[r.id]))
    })().finally(() => { this.stageBatch = null })
    return this.stageBatch
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
  private readDetail(id: string) {
    const pending = this.rawDetails.get(id)
    if (pending) return pending
    const request = Promise.resolve().then(() => this.deps.detail(id)).then(raw => {
      if (raw.id !== id || !Array.isArray(raw.measurements)) throw new Error('Decaid did not return the measurements for this shot.')
      return raw
    }).finally(() => this.rawDetails.delete(id))
    this.rawDetails.set(id, request)
    return request
  }
  // Migration v1: small, resumable batches. Keep only the duration, not 1,000 graphs.
  // The per-record marker also remembers genuinely missing data and survives releases.
  reconcileDurationBatch(canContinue: () => boolean = () => true): Promise<boolean> {
    if (this.durationBatch) return this.durationBatch
    this.durationBatch = (async () => {
      await this.load()
      const initial = this.state.cache
      if (!initial) return false
      const pending = initial.records.filter(r => r.duration === null && r.durationReconciled !== 1).slice(0, 5)
      const results = new Map<string, { signature: string; duration: number | null }>()
      try {
        for (const record of pending) {
          if (!canContinue()) break
          let duration: number | null = null
          const cached = this.state.cache?.details[record.id]
          if (cached) duration = savedDuration(cached)
          else {
            try {
              const raw = await this.readDetail(record.id)
              const normalized = normalizeShot(raw, initial.timezone)
              // Don't attach measurements to a different revision; refresh will reconcile it.
              if (normalized?.signature !== record.signature) throw new Error('Saved shot changed during duration reconciliation.')
              duration = savedDuration(this.deps.toDetail(raw))
            } catch (error) {
              // Deleted records must not block the rest of the archive. Transient failures retry.
              if (!(error instanceof Error && 'status' in error && error.status === 404)) throw error
            }
          }
          results.set(record.id, { signature: record.signature, duration })
        }
      } finally {
        const current = this.state.cache
        if (current && results.size) {
          const cache = { ...current, records: current.records.map(record => {
            const result = results.get(record.id)
            return result?.signature === record.signature
              ? { ...record, duration: record.duration ?? result.duration, durationReconciled: 1 as const }
              : record
          }) }
          this.update({ cache })
          await this.persist(cache)
        }
      }
      return !this.state.cache?.records.some(r => r.duration === null && r.durationReconciled !== 1)
    })().finally(() => { this.durationBatch = null })
    return this.durationBatch
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
      if (Object.hasOwn(initial.details, id)) {
        const detail = this.reconcileDetail(initial.details[id], record.signature)
        if (detail !== initial.details[id]) {
          const cache = attachDetail(initial, id, record.signature, detail)
          this.update({ cache })
          await this.persist(cache)
        }
        return detail
      }
      const raw = await this.readDetail(id)
      const normalized = normalizeShot(raw, initial.timezone)
      if (!normalized) throw new Error('This saved shot is missing its date or identity.')
      const detail = this.reconcileDetail(this.deps.toDetail(raw), normalized.signature)
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
