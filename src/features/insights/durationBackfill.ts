export function startDurationBackfill(options: {
  batch: (canContinue: () => boolean) => Promise<boolean>
  visible: () => boolean
  schedule: (callback: () => void, delay: number) => () => void
}) {
  let stopped = false, running = false, complete = false, failures = 0
  let cancel: (() => void) | undefined
  const canContinue = () => !stopped && options.visible()
  const resume = () => {
    if (!canContinue() || running || complete) return
    cancel?.()
    running = true
    void options.batch(canContinue).then(done => {
      complete = done
      failures = 0
    }).catch(() => { failures++ }).finally(() => {
      running = false
      if (!canContinue() || complete) return
      const delay = failures ? [5000, 15000, 30000, 60000][Math.min(failures - 1, 3)] : 1000
      cancel = options.schedule(resume, delay)
    })
  }
  resume()
  return { resume, stop: () => { stopped = true; cancel?.() } }
}
