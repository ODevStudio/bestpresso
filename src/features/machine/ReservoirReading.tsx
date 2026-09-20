import reservoirIcon from '../../assets/figma/reservoir.svg'
import type { MachineUtility } from '../../domain/brewing'
import { formatNumber, t } from '../../i18n/index.ts'
import './hardware.css'

export function ReservoirReading({ utility }: { utility: MachineUtility }) {
  const value = utility.waterLevelMm
  const volume = Number(utility.metrics[0]?.value)
  const height = value === undefined ? t('shell.tank.unknownLevel') : `${formatNumber(value, { maximumFractionDigits: 1 })} mm`
  const label = utility.alert ? t('shell.tank.needsWater', { value: height }) : utility.warning ? t('shell.tank.low', { value: height }) : t('shell.tank.status', { value: height })
  return <section className={`reservoir-meter reservoir-reading${utility.alert ? ' reservoir-meter--needs-water' : utility.warning ? ' reservoir-meter--warning' : ''}`} aria-label={label} title={label}>
    <img src={reservoirIcon} alt="" />
    <strong>{height}</strong>
    {value !== undefined && Number.isFinite(volume) && <span title={t('hardware.estimated')}><span className="reservoir-reading__volume">{`~${formatNumber(volume)}`}</span><br />ml</span>}
    {utility.refillLevelMm !== undefined && <small>{t('hardware.refill', { value: utility.refillLevelMm })}</small>}
  </section>
}
