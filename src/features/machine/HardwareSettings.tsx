import { t } from '../../i18n/index.ts'
import { hasCapability, machineSession } from './machineSession'
import { useMachineSession } from './useMachineSession'
import { CalibrationSettings } from './CalibrationSettings'
import { CupWarmerSettings, PreheatSettings } from './CupWarmerSettings'
import { LightingSettings } from './LightingSettings'
import './hardware.css'

export function HardwareSettings() {
  const session = useMachineSession()
  const unknown = t('hardware.unavailable')
  const refillKit = session.info?.extra?.refillKit
  return <div className="hardware-settings" key={session.generation}>
    <dl className="hardware-summary">
      <dt>{t('hardware.model')}</dt><dd>{session.info?.model ?? unknown}</dd>
      <dt>{t('hardware.firmware')}</dt><dd>{session.info?.version ?? unknown}</dd>
      <dt>{t('hardware.refillKit')}</dt><dd>{refillKit === undefined ? unknown : t(refillKit ? 'hardware.yes' : 'hardware.no')}</dd>
      <dt>{t('hardware.capabilities')}</dt><dd>{session.capabilities?.join(', ') || (session.capabilities ? t('hardware.none') : unknown)}</dd>
    </dl>
    <div className="hardware-actions"><button type="button" disabled={!session.deviceId || session.metadataStatus === 'loading'} onClick={() => machineSession.connect(session.deviceId, true)}>{t('hardware.reload')}</button></div>
    {hasCapability('scaleCalibration', session) && <CalibrationSettings />}
    {hasCapability('cupWarmer', session) && <CupWarmerSettings />}
    {hasCapability('preheat', session) && <PreheatSettings />}
    {hasCapability('ledStrip', session) && <LightingSettings />}
  </div>
}
