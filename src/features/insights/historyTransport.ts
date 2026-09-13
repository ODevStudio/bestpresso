import type { PaginatedShots, ShotRecord } from '../../api/decaid/types.ts'

export async function historyGet<T>(source: string, path: string, request: typeof fetch = fetch): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await request(`${source}${path}`, { signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new Error(response.status === 404 ? 'This shot is no longer available in Decaid.' : `Could not read Decaid history (${response.status}).`)
    return await response.json() as T
  } finally { clearTimeout(timer) }
}
export const readHistoryPage = (source: string) => historyGet<PaginatedShots>(source, '/shots?limit=100&offset=0&orderBy=timestamp&order=desc')
export const readHistoryDetail = (source: string, id: string) => historyGet<ShotRecord>(source, `/shots/${encodeURIComponent(id)}`)
