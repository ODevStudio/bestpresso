import { useState } from 'react'
import { getLighting, setLighting } from '../../api/decaid/hardware'
import type { Lighting } from '../../api/decaid/hardwareTypes'
import { t } from '../../i18n/index.ts'
import { HardwarePanel } from './HardwareControls'
import { sameFields } from './hardwareActions'
import { useHardwareResource } from './useHardwareResource'
import { color16, color8 } from './colorPalette'

export function LightingSettings() {
  const resource = useHardwareResource('ledStrip', getLighting)
  const [draft, setDraft] = useState<Lighting>()
  const value = draft ?? resource.value
  return <HardwarePanel title={t('hardware.lighting')} {...resource} reload={async () => { setDraft(undefined); await resource.reload() }}>
    {value && <fieldset disabled={resource.disabled}>
      {(['frontStrip', 'backStrip'] as const).map(zone => <div key={zone}>
        <h3>{t(zone === 'frontStrip' ? 'hardware.front' : 'hardware.back')}</h3>
        {(['awake', 'sleeping'] as const).map(mode => <label key={mode}><span>{t(`hardware.${mode}`)}</span><input type="color" value={color8(value[zone][mode])} onChange={event => setDraft({ ...value, [zone]: { ...value[zone], [mode]: color16(event.target.value) } })} /></label>)}
      </div>)}
      {resource.value?.frontSwitch && <div><h3>{t('hardware.switch')}</h3>{(['awake', 'sleeping'] as const).map(mode => <label key={mode}><span>{t(`hardware.${mode}`)}</span><input type="color" disabled value={color8(resource.value!.frontSwitch![mode])} /></label>)}</div>}
      <div className="hardware-actions"><button type="button" disabled={!draft} onClick={() => {
        const expected = { frontStrip: value.frontStrip, backStrip: value.backStrip }
        void resource.save(() => setLighting(expected), result => sameFields(expected, result)).then(saved => { if (saved) setDraft(undefined) })
      }}>{t('hardware.apply')}</button></div>
    </fieldset>}
  </HardwarePanel>
}
