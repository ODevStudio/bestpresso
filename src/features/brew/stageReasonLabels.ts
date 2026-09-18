import { formatDecimal, t } from '../../i18n/index.ts'

type FixedReasonKey =
  | 'brew.stage.reason.targetYieldReached'
  | 'brew.stage.reason.targetVolumeReached'
  | 'brew.stage.reason.manualStop'
  | 'brew.stage.reason.manualAdvance'
  | 'brew.stage.reason.machineError'
  | 'brew.stage.reason.connectionLost'
  | 'brew.stage.reason.unknown'
  | 'brew.stage.reason.timeLimitReached'
  | 'brew.stage.reason.stageYieldReached'
  | 'brew.stage.reason.stageVolumeReached'

/** stageMoveOn.ts always generates these reasons in English (persisted evidence).
 * This is the only place that translates them, at display time. */
const fixedReasonKeys: Record<string, FixedReasonKey> = {
  'Target yield reached': 'brew.stage.reason.targetYieldReached',
  'Target volume reached': 'brew.stage.reason.targetVolumeReached',
  'Manually stopped': 'brew.stage.reason.manualStop',
  'Manually advanced': 'brew.stage.reason.manualAdvance',
  'Machine error': 'brew.stage.reason.machineError',
  'Connection lost': 'brew.stage.reason.connectionLost',
  Unknown: 'brew.stage.reason.unknown',
  'Time limit reached': 'brew.stage.reason.timeLimitReached',
  'Stage yield reached': 'brew.stage.reason.stageYieldReached',
  'Stage volume reached': 'brew.stage.reason.stageVolumeReached',
}

const SENSOR_EXIT = /^(Pressure|Flow) (>|<)([\d.]+) (bar|ml\/s) reached$/

const translateReason = (reason: string): string => {
  const sensorExit = SENSOR_EXIT.exec(reason)
  if (sensorExit) {
    const [, type, symbol, rawValue, unit] = sensorExit
    const digits = rawValue.includes('.') ? rawValue.split('.')[1].length : 0
    return t('brew.stage.reason.sensorExitReached', {
      type: t(type === 'Pressure' ? 'brew.metric.pressure' : 'common.metric.flow'),
      symbol,
      value: formatDecimal(Number(rawValue), digits),
      unit,
    })
  }
  const key = fixedReasonKeys[reason]
  return key ? t(key) : reason
}

/** Keep cached evidence unchanged (English); translate only the displayed wording.
 * `label` may join several alternative reasons with " or "; consecutive reasons
 * that both end in the "reached" wording drop it from all but the last one.
 * Unrecognised text (a future stageMoveOn addition) is shown exactly as cached,
 * in English. */
export function stageReasonLabels(label = 'Unknown'): string[] {
  const translated = label.split(' or ').map(translateReason)
  const reachedSuffix = t('brew.stage.reason.reachedSuffix')
  return translated.map((reason, index) =>
    reason.endsWith(reachedSuffix) && translated[index + 1]?.endsWith(reachedSuffix)
      ? reason.slice(0, -(reachedSuffix.length + 1))
      : reason,
  )
}
