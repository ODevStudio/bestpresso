import { useState } from 'react'
import { calibrate, getCalibration } from '../../api/decaid/hardware'
import { inRange } from '../../api/decaid/hardwareValidation'
import type { CalibrationCommand } from '../../api/decaid/hardwareTypes'
import { t } from '../../i18n/index.ts'
import { HardwareNumber, HardwarePanel } from './HardwareControls'
import { useHardwareResource } from './useHardwareResource'
import { useMachineSession } from './useMachineSession'

export function CalibrationSettings() {
  const session = useMachineSession()
  const resource = useHardwareResource('scaleCalibration', getCalibration, 1000)
  const [mass, setMass] = useState(100)
  const state = resource.value
  const running = state && ['zeroing', 'calLatch', 'taring'].includes(state.step) && !['done', 'error'].includes(state.subState)
  const command = (command: CalibrationCommand) => {
    if (command !== 'abort' && !window.confirm(t(command === 'zero' ? 'hardware.confirmZero' : 'hardware.confirmLatch'))) return
    void resource.save(() => calibrate(command, mass), result => command === 'abort'
      ? result.step === 'idle' || result.step === 'error'
      : result.step !== 'error' && result.subState !== 'error', true)
  }
  return <HardwarePanel title={t('hardware.calibration')} {...resource}>
    {state && <output>{`${state.step} / ${state.detectedCell} / ${state.subState} / ${state.status} / ${state.secondsRemaining} s`}</output>}
    {session.state !== 'idle' && <p>{t('hardware.idleRequired')}</p>}
    <fieldset disabled={resource.disabled || session.state !== 'idle'}>
      <HardwareNumber label={t('hardware.mass')} value={mass} min={1} max={10000} step={0.01} onChange={setMass} />
      <div className="hardware-actions">
        <button type="button" disabled={Boolean(running)} onClick={() => command('zero')}>{t('hardware.zero')}</button>
        <button type="button" disabled={Boolean(running) || !inRange(mass, 1, 10000)} onClick={() => command('latch')}>{t('hardware.latch')}</button>
        <button type="button" onClick={() => command('abort')}>{t('hardware.abort')}</button>
      </div>
    </fieldset>
  </HardwarePanel>
}
