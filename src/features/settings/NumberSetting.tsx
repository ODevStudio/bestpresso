import { useValueAdjustment } from '../../components/ValueAdjustment/ValueAdjustmentContext'
import type { SettingsValueAdjustmentKey, ValueAdjustmentMode } from '../../domain/valueAdjustments'
import { formatDecimal, t } from '../../i18n/index.ts'

export function NumberSetting({ label, hint, value, unit = '', min, max, step = 1, digits = 0, disabled = false, adjustmentKey, presets, coerce, adjust, onChange }: { label: string; hint?: string; value?: number; unit?: string; min: number; max?: number; step?: number; digits?: number; disabled?: boolean; adjustmentKey?: string; presets?: readonly number[]; coerce?: (value: number) => number; adjust?: (value: number, direction: -1 | 1) => number; onChange: (value: number) => void }) {
  const openAdjustment = useValueAdjustment()
  const normalize = (candidate: number) => {
    const bounded = Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, candidate))
    return Number((coerce ? coerce(bounded) : bounded).toFixed(digits))
  }
  const move = (direction: -1 | 1) => {
    const current = value ?? min
    const next = normalize(adjust ? adjust(current, direction) : current + (step * direction))
    onChange(next)
  }
  const open = () => {
    if (disabled || value === undefined) return
    const mode: ValueAdjustmentMode = digits > 0 ? 'decimal' : 'integer'
    const key = `settings:${adjustmentKey ?? `${label}-${unit}-${min}-${max}-${step}`}` as SettingsValueAdjustmentKey
    const adjustmentMax = max ?? Math.max(600, Math.ceil(value / 60) * 60)
    openAdjustment({
      label,
      value,
      unit,
      min,
      max: adjustmentMax,
      step,
      mode,
      suggestionKey: key,
      presets,
      onSave: (next) => onChange(normalize(next)),
    })
  }
  const displayValue = value === undefined ? '—' : formatDecimal(value, digits)
  return <div className="settings-number-row"><span><strong>{label}</strong>{hint && <small>{hint}</small>}</span><div className="settings-number-control"><button type="button" disabled={disabled || value === undefined} aria-label={t('settings.number.decrease', { label })} onClick={() => move(-1)}>−</button><button className="settings-number-value" type="button" disabled={disabled || value === undefined} aria-label={t('settings.number.adjust', { label, value: `${displayValue}${unit}` })} onClick={open}><span>{displayValue}</span>{unit && <small className={unit === '°' ? 'settings-number-unit--degree' : undefined}>{unit}</small>}</button><button type="button" disabled={disabled || value === undefined} aria-label={t('settings.number.increase', { label })} onClick={() => move(1)}>+</button></div></div>
}
