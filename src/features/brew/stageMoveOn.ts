import type { DecaidProfileStep } from '../../api/decaid/types.ts'
import type { LiveShotPoint, PreviousShot } from '../../domain/brewing.ts'

export const STAGE_REASON_VERSION = 1
export interface StageAdvanceEvidence {
  frame: number
  timestamp: number
  reason: 'manual' | 'weight'
}
export interface StageMoveOnReason {
  label: string
  source: 'recorded' | 'telemetry' | 'unknown'
  kind: 'advance' | 'stop'
}
export interface StageReasonAnalysis {
  version: number
  reasons: Record<string, StageMoveOnReason>
}
export const stageReasonKey = (point: LiveShotPoint) => `${point.stageIndex ?? point.stageName ?? 'Extraction'}:${point.elapsedMs}`
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
const positive = (n: unknown): n is number => finite(n) && n > 0
const stopLabels: Record<string, string> = {
  targetWeight: 'Target yield reached', targetVolume: 'Target volume reached',
  apiStop: 'Manually stopped', appStop: 'Manually stopped',
  error: 'Machine error', disconnected: 'Connection lost',
}

/** Analyse observed boundaries, never planned stages or the current live stage.
 * Samples after a boundary belong to the new stage and cannot prove a sensor exit.
 * Firmware limiters are intentionally NOT exits. */
export function analyseStageMoveOn(points: LiveShotPoint[], steps: DecaidProfileStep[] = [], options: {
  active?: boolean; evidence?: StageAdvanceEvidence[]; telemetryStartedAt?: number; stopReason?: string
} = {}): StageReasonAnalysis {
  const groups: LiveShotPoint[][] = []
  for (const point of points) {
    if (!finite(point.elapsedMs)) continue
    const group = groups.at(-1)
    const previous = group?.at(-1)
    if (!previous || previous.stageIndex !== point.stageIndex || (point.stageIndex === undefined && previous.stageName !== point.stageName)) groups.push([point])
    else group!.push(point)
  }
  const reasons: StageReasonAnalysis['reasons'] = {}
  groups.forEach((group, index) => {
    const first = group[0], last = group.at(-1)!, next = groups[index + 1]?.[0]
    if (!next && options.active) return
    const kind = next ? 'advance' : 'stop'
    const put = (label: string, source: StageMoveOnReason['source']) => { reasons[stageReasonKey(first)] = { label, source, kind } }
    if (!next) {
      const label = options.stopReason && stopLabels[options.stopReason]
      put(label || 'Unknown', label ? 'recorded' : 'unknown')
      return
    }
    // An issued request only explains an observed, adjacent advance of its own
    // frame within two seconds. Replays, late requests and jumps aren't proof.
    const boundary = finite(options.telemetryStartedAt) ? options.telemetryStartedAt + next.elapsedMs : undefined
    const explicit = boundary === undefined || first.stageIndex === undefined || next.stageIndex !== first.stageIndex + 1 ? []
      : (options.evidence ?? []).filter(e => e.frame === first.stageIndex && finite(e.timestamp)
        && e.timestamp >= options.telemetryStartedAt! + first.elapsedMs
        && e.timestamp <= boundary && boundary - e.timestamp <= 2000)
    if (explicit.length) {
      const labels = [...new Set(explicit.map(e => e.reason === 'manual' ? 'Manually advanced' : 'Stage yield reached'))]
      put(labels.join(' or '), 'recorded')
      return
    }
    const step = first.stageIndex === undefined ? undefined : steps[first.stageIndex]
    const contiguous = next.elapsedMs > last.elapsedMs && next.elapsedMs - last.elapsedMs <= 1500
      && group.every((p, i) => i === 0 || (p.elapsedMs > group[i - 1].elapsedMs && p.elapsedMs - group[i - 1].elapsedMs <= 1500))
    if (!step || !contiguous || next.stageIndex !== first.stageIndex! + 1) { put('Unknown', 'unknown'); return }
    const candidates: string[] = []
    const previous = groups[index - 1]?.at(-1)
    const knownStart = index > 0 ? previous?.stageIndex === first.stageIndex! - 1 && first.elapsedMs - previous.elapsedMs <= 1500
      : first.stageIndex === 0 && first.elapsedMs === 0
    // Boundary timing is an interval, not the timestamp of the first new sample.
    const minimumTime = last.elapsedMs - first.elapsedMs
    const maximumTime = next.elapsedMs - (previous?.elapsedMs ?? first.elapsedMs)
    if (knownStart && positive(step.seconds) && step.seconds * 1000 >= minimumTime - 100 && step.seconds * 1000 <= maximumTime + 100) candidates.push('Time limit reached')
    const exit = step.exit
    if (exit && positive(exit.value) && (exit.type === 'pressure' || exit.type === 'flow') && (exit.condition === 'over' || exit.condition === 'under')) {
      const value = last[exit.type]
      if (finite(value) && (exit.condition === 'over' ? value >= exit.value : value <= exit.value)) candidates.push(`${exit.type === 'pressure' ? 'Pressure' : 'Flow'} threshold reached`)
    }
    // Historical projected-weight decisions aren't recoverable. Actual weight
    // crossing is only an inferred candidate, never an explicit override.
    if (positive(step.weight) && finite(last.weight) && last.weight >= step.weight) candidates.push('Stage yield reached')
    if (knownStart && positive(step.volume) && group.length > 1 && group.every(p => finite(p.flow))) {
      let volume = 0
      for (let i = 1; i < group.length; i++) volume += Math.max(0, (group[i - 1].flow! + group[i].flow!) / 2) * (group[i].elapsedMs - group[i - 1].elapsedMs) / 1000
      const uncertainty = Math.max(0, first.flow!, last.flow!) * ((first.elapsedMs - (previous?.elapsedMs ?? first.elapsedMs)) + next.elapsedMs - last.elapsedMs) / 1000
      if (step.volume >= volume && step.volume <= volume + uncertainty) candidates.push('Stage volume reached')
    }
    put(candidates.join(' or ') || 'Unknown', candidates.length ? 'telemetry' : 'unknown')
  })
  return { version: STAGE_REASON_VERSION, reasons }
}

export function reconcileStageReasons(detail: PreviousShot, signature?: string): PreviousShot {
  if (detail.stageReasons?.version === STAGE_REASON_VERSION || !detail.points?.length) return detail
  // Old cached details didn't retain the recipe, but their revision signature
  // contains the shot-time workflow. Never substitute today's selected recipe.
  let saved: { workflow?: { profile?: { steps?: DecaidProfileStep[] } }; stopReason?: string } = {}
  try { saved = signature ? JSON.parse(signature) : {} } catch { /* legacy cache */ }
  const profileSteps = detail.profileSteps ?? saved?.workflow?.profile?.steps
  const stopReason = detail.stopReason ?? saved?.stopReason
  return { ...detail, profileSteps, stopReason, stageReasons: analyseStageMoveOn(detail.points, profileSteps, {
    evidence: detail.stageEvidence, telemetryStartedAt: detail.telemetryStartedAt, stopReason,
  }) }
}
