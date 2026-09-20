import { useState } from 'react'
import { getCupWarmer, getPreheat, setCupWarmer, setPreheat } from '../../api/decaid/hardware'
import { inRange } from '../../api/decaid/hardwareValidation'
import { t } from '../../i18n/index.ts'
import { HardwareNumber, HardwarePanel, HardwareToggle } from './HardwareControls'
import { sameFields } from './hardwareActions'
import { useHardwareResource } from './useHardwareResource'

export function CupWarmerSettings() {
  const resource = useHardwareResource('cupWarmer', getCupWarmer)
  const [draft, setDraft] = useState<{ temperature: number; enabled: boolean }>()
  const value = draft ?? resource.value
  return <HardwarePanel title={t('hardware.cupWarmer')} {...resource} reload={async () => { setDraft(undefined); await resource.reload() }}>
    {value && <fieldset disabled={resource.disabled}>
      <HardwareToggle label={t('hardware.enabled')} checked={value.enabled} onChange={enabled => setDraft({ temperature: value.temperature, enabled })} />
      <HardwareNumber label={`${t('hardware.target')} (°C)`} value={value.temperature} max={80} onChange={temperature => setDraft({ enabled: value.enabled, temperature })} />
      <div className="hardware-reading"><span>{t('hardware.current')}</span><span>{`${resource.value?.currentTemperature ?? '-'} °C`}</span></div>
      <div className="hardware-actions"><button type="button" disabled={!draft || !inRange(value.temperature, 0, 80, true)} onClick={() => {
        const expected = { enabled: value.enabled && value.temperature > 0, temperature: value.temperature }
        void resource.save(() => setCupWarmer(expected), result => sameFields(expected, result)).then(saved => { if (saved) setDraft(undefined) })
      }}>{t('hardware.apply')}</button></div>
    </fieldset>}
  </HardwarePanel>
}

export function PreheatSettings() {
  const resource = useHardwareResource('preheat', getPreheat)
  const [draft, setDraft] = useState<{ enabled: boolean; leadMinutes: number }>()
  const value = draft ?? resource.value
  return <HardwarePanel title={t('hardware.preheat')} {...resource} reload={async () => { setDraft(undefined); await resource.reload() }}>
    {value && <fieldset disabled={resource.disabled}>
      <HardwareToggle label={t('hardware.enabled')} checked={value.enabled} onChange={enabled => setDraft({ leadMinutes: value.leadMinutes, enabled })} />
      <HardwareNumber label={t('hardware.lead')} value={value.leadMinutes} max={120} onChange={leadMinutes => setDraft({ enabled: value.enabled, leadMinutes })} />
      <output>{t(resource.value?.active ? 'hardware.active' : 'hardware.inactive')}</output>
      <div className="hardware-actions"><button type="button" disabled={!draft || !inRange(value.leadMinutes, 0, 120, true)} onClick={() => {
        const expected = { enabled: value.enabled, leadMinutes: value.leadMinutes }
        void resource.save(() => setPreheat(expected), result => sameFields(expected, result)).then(saved => { if (saved) setDraft(undefined) })
      }}>{t('hardware.apply')}</button></div>
    </fieldset>}
  </HardwarePanel>
}
