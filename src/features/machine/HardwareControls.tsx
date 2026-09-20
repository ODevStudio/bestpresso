import type { ReactNode } from 'react'
import { t } from '../../i18n/index.ts'
import { NumberSetting } from '../settings/NumberSetting'

export function HardwarePanel({ title, children, status, requestError, reload, busy }: { title: string; children: ReactNode; status: 'loading' | 'unavailable' | 'failed' | 'saved' | null; requestError?: string; reload: () => Promise<void>; busy: boolean }) {
  return <section className="hardware-panel"><h2>{title}</h2>{children}
    {status && <output role={status === 'failed' ? 'alert' : 'status'}>{t(`hardware.${status}`)}</output>}
    {status === 'failed' && requestError && <output>{requestError}</output>}
    <div className="hardware-actions"><button type="button" disabled={busy} onClick={() => void reload()}>{t('hardware.reload')}</button></div>
  </section>
}

export function HardwareNumber({ label, value, min = 0, max, step = 1, onChange }: { label: string; value: number; min?: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <NumberSetting label={label} value={value} min={min} max={max} step={step} digits={String(step).split('.')[1]?.length ?? 0} onChange={onChange} />
}

export function HardwareToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label><span>{label}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /></label>
}
