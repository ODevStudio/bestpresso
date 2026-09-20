import reservoirIcon from '../../assets/figma/reservoir.svg'
import type { MachineUtility } from '../../domain/brewing'
import { formatNumber, t } from '../../i18n/index.ts'
import { BENGLE_WATER_WARNING_MM, waterGauge } from './waterTelemetry'
import './hardware.css'

export function ReservoirReading({ utility }: { utility: MachineUtility }) {
  const value = utility.waterLevelMm
  const volume = Number(utility.metrics[0]?.value)
  const warning = utility.warningLevelMm ?? BENGLE_WATER_WARNING_MM
  const gauge = waterGauge(value, warning)
  const available = gauge.heightPercent !== undefined
  const reading = available ? formatNumber(value!, { maximumFractionDigits: 1 }) : '-'
  const height = available ? `${reading} mm` : t('shell.tank.unknownLevel')
  const label = utility.alert ? t('shell.tank.needsWater', { value: height }) : utility.warning ? t('shell.tank.low', { value: height }) : t('shell.tank.status', { value: height })
  const warningLabel = `${t('settings.alerts.warnMe')}: ${formatNumber(warning)} mm`
  const details = [label, warningLabel, available && Number.isFinite(volume) ? `${t('hardware.estimated')}: ${formatNumber(volume)} ml` : '', utility.refillLevelMm !== undefined ? t('hardware.refill', { value: utility.refillLevelMm }) : ''].filter(Boolean).join('\n')
  return <section className={`reservoir-meter reservoir-reading${utility.alert ? ' reservoir-meter--needs-water' : utility.warning ? ' reservoir-meter--warning' : ''}`} aria-label={details} title={details}>
    <span className="reservoir-meter__icon"><img src={reservoirIcon} alt="" /></span>
    <strong className="reservoir-reading__value">{reading}<small>mm</small></strong>
    <div className="reservoir-reading__gauge" role={available ? 'meter' : undefined} aria-label={label} aria-valuemin={available ? 0 : undefined} aria-valuemax={available ? gauge.maximumMm : undefined} aria-valuenow={available ? value : undefined} aria-valuetext={height}>
      {available && <div className="reservoir-meter__level" style={{ height: `${gauge.heightPercent}%` }} />}
      {[0, gauge.maximumMm / 2, gauge.maximumMm].map(tick => <span key={tick} className="reservoir-reading__tick" style={{ bottom: `${tick / gauge.maximumMm * 100}%` }}>{formatNumber(tick)}</span>)}
      <span className="reservoir-reading__warning" style={{ bottom: `${gauge.warningPercent}%` }} title={warningLabel}><span>{formatNumber(warning)}</span></span>
    </div>
  </section>
}
