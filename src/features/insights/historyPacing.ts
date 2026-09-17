// Insights reads shot history over the same Decaid process that drives the machine
// and scale over Bluetooth. A full 1,000-shot pull is ten back-to-back pages, and the
// duration backfill after a fresh cache is about 1,000 detail reads at one batch a
// second; on a tablet that is a noticeable burst. These spread the work out.

// Minimum gap between history page reads.
export const PAGE_GAP_MS = 750

// Minimum gap between duration backfill batches (five detail reads each).
export const BACKFILL_GAP_MS = 4_000

type Wait = (ms: number) => Promise<void>
const wait: Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Serialises calls and leaves at least `gapMs` between the end of one and the start of the next.
export function pacedReader<A extends unknown[], T>(read: (...args: A) => Promise<T>, gapMs: number, now: () => number = Date.now, sleep: Wait = wait) {
  let queue: Promise<unknown> = Promise.resolve()
  let lastFinished = Number.NEGATIVE_INFINITY
  return (...args: A): Promise<T> => {
    const run = queue.then(async () => {
      const remaining = lastFinished + gapMs - now()
      if (remaining > 0) await sleep(remaining)
      try { return await read(...args) } finally { lastFinished = now() }
    })
    queue = run.catch(() => undefined)
    return run
  }
}

// Stretches a scheduler so no callback runs sooner than `minimumMs`.
export const atLeast = (schedule: (callback: () => void, delay: number) => () => void, minimumMs: number) =>
  (callback: () => void, delay: number) => schedule(callback, Math.max(delay, minimumMs))
