export const STOP_CONFIRM_TIMEOUT_MS = 2_500
export const STOP_REQUEST_ATTEMPTS = 2

export type StopRequestResult = 'confirmed' | 'unconfirmed' | 'failed'

interface StopRequestApi {
  sendIdle: () => Promise<void>
  /** True while telemetry still reports the shot that should be stopped. */
  stillRunning: () => boolean
  wait: (ms: number) => Promise<void>
  attempts?: number
  confirmTimeoutMs?: number
}

/**
 * An accepted `idle` request is not proof the machine stopped (lost BLE command,
 * busy queue). Resend once when telemetry does not confirm the stop, then hand
 * the button back to the user instead of leaving it pending forever.
 */
export async function requestMachineStop({ sendIdle, stillRunning, wait, attempts = STOP_REQUEST_ATTEMPTS, confirmTimeoutMs = STOP_CONFIRM_TIMEOUT_MS }: StopRequestApi): Promise<StopRequestResult> {
  let lastAttemptFailed = false
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (!stillRunning()) return 'confirmed'
    try {
      await sendIdle()
      lastAttemptFailed = false
    } catch {
      lastAttemptFailed = true
    }
    await wait(confirmTimeoutMs)
    if (!stillRunning()) return 'confirmed'
  }
  return lastAttemptFailed ? 'failed' : 'unconfirmed'
}
