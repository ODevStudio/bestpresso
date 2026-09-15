import { useEffect, useRef, useState, type CSSProperties } from 'react'
import hotWaterIcon from '../../assets/figma/hot-water.svg'
import steamIcon from '../../assets/figma/steam.svg'
import steamCompactConnector from '../../assets/figma/steam-compact-connector.svg'
import { Metric, type MetricEdit } from '../../components/Metric/Metric'
import { useValueAdjustment } from '../../components/ValueAdjustment/ValueAdjustmentContext'
import type { DisplayMetric, MachineUtility } from '../../domain/brewing'
import { formatTemperatureValue, temperatureBoundToDisplay, type TemperatureUnit } from '../../domain/temperature'
import { VALUE_ADJUSTMENTS } from '../../domain/valueAdjustments'
import { TemperatureReading } from './TemperatureReading'
import { GAUGE_MIN_C, GAUGE_CENTER, GAUGE_RADIUS, gaugeArcPath, gaugeFraction, gaugeGeometry, gaugeLayout, steamBelowReadyRange } from './steamGauge'

interface Props {
  utility: MachineUtility
  metrics: DisplayMetric[]
  compact: boolean
  temperatureUnit: TemperatureUnit
  disabled?: boolean
  onExpand?: () => void
  onToggleSteam: () => void
  getEdit: (label: string) => MetricEdit | undefined
}

export function DrinkUtilityCard({ utility, metrics, compact, temperatureUnit, disabled, onExpand, onToggleSteam, getEdit }: Props) {
  const openAdjustment = useValueAdjustment()
  const steam = utility.id === 'steam'
  const temperatureSpace = useRef<HTMLDivElement>(null)
  const [tallGauge, setTallGauge] = useState(false)
  useEffect(() => {
    const element = temperatureSpace.current
    if (!steam || !element) return
    const observer = new ResizeObserver(([entry]) => {
      setTallGauge(gaugeLayout(entry.contentRect.width, entry.contentRect.height).tall)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [steam])
  const gaugeSweep = tallGauge ? 240 : 144
  const gaugeViewHeight = tallGauge ? 158 : 80
  const gaugePath = gaugeArcPath(1, gaugeSweep)
  const enabled = utility.enabled !== false
  const metric = (label: string): DisplayMetric => metrics.find(item => item.label === label) ?? { label, value: '—' }
  const currentC = Number(utility.metrics.find(item => item.label === 'Current')?.value)
  const targetC = Number(utility.metrics.find(item => item.label === 'Target')?.value)
  const currentValid = Number.isFinite(currentC)
  const targetValid = Number.isFinite(targetC)
  const heating = steamBelowReadyRange(currentC, targetC, enabled)
  const maxC = VALUE_ADJUSTMENTS.steamTemperature.max
  const fraction = gaugeFraction(currentC, GAUGE_MIN_C, maxC)
  const marker = gaugeGeometry(targetC, GAUGE_MIN_C, maxC, gaugeSweep)
  const target = metric('Target')
  const targetEdit = getEdit('Target')
  const targetDisabled = disabled || !targetEdit || !Number.isFinite(Number(target.value))
  const currentText = currentValid ? `${formatTemperatureValue(currentC, temperatureUnit)}°` : '—'
  const targetText = targetValid ? `${target.value}°` : '—'
  const displayMetric = (label: string, displayLabel = label) => <Metric size="small" metric={{ ...metric(label), label: displayLabel }} edit={getEdit(label)} />
  const icon = steam ? steamIcon : hotWaterIcon
  const compactMetrics = steam ? metrics.map(item => item.label === 'Current' ? { ...item, value: enabled ? item.value : '—', highlight: heating } : item)
    : ['Volume', 'Temperature'].map(metric)

  return <section className={`utility-card utility-card--${utility.id} drink-card${compact ? ' is-compact' : ''}${steam && !enabled ? ' utility-card--steam-off' : ''}`} data-layout={compact ? 'compact' : 'expanded'}>
    <div className={`drink-card__face drink-card__compact utility-card--compact utility-card--${utility.id}`} inert={!compact} aria-hidden={!compact}>
      <button className="drink-card__expand" type="button" aria-label={`Expand utility panels to view ${utility.label}`} onClick={onExpand} />
      <header><img src={icon} alt="" /><span>{utility.label}</span></header>
      <div className="utility-card__metrics">{compactMetrics.map(item => <Metric key={item.label} metric={item} compact size="small" />)}</div>
      {steam && <span className="utility-card__steam-connector" aria-hidden="true"><img src={steamCompactConnector} alt="" /></span>}
    </div>
    <div className="drink-card__face drink-card__expanded" inert={compact} aria-hidden={compact}>
      <header><img src={icon} alt="" /><h2>{utility.label}</h2>{steam && <button className="drink-card__toggle" type="button" role="switch" aria-checked={enabled} aria-label={enabled ? 'Disable steam heating' : 'Enable steam heating'} disabled={disabled} onClick={onToggleSteam}><span /></button>}</header>
      {!steam ? <div className="drink-card__water-settings"><div>{displayMetric('Temperature')}</div><div>{displayMetric('Volume')}</div></div>
        : <div className="drink-card__steam-settings">
          <div className="drink-card__temperature-space" ref={temperatureSpace}>
          <div className={`drink-card__gauge${heating ? ' is-heating' : ''}`} data-tall={tallGauge} style={{ '--gauge-target-angle': `${marker.angle}deg`, '--gauge-view-height': gaugeViewHeight } as CSSProperties}>
            <svg className="drink-card__gauge-art" viewBox={`0 0 197 ${gaugeViewHeight}`} role="meter" aria-label="Steam temperature" aria-valuemin={temperatureBoundToDisplay(GAUGE_MIN_C, temperatureUnit)} aria-valuemax={temperatureBoundToDisplay(maxC, temperatureUnit)} aria-valuenow={currentValid ? temperatureBoundToDisplay(Math.max(GAUGE_MIN_C, Math.min(maxC, currentC)), temperatureUnit) : undefined} aria-valuetext={enabled ? `${currentText} current, ${targetText} target` : 'Steam heating off'}>
              <path className="drink-card__gauge-track" d={gaugePath} />
              <path className="drink-card__gauge-fill" d={gaugePath} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - fraction} data-empty={!currentValid || fraction === 0} />
              <g className="drink-card__gauge-marker" visibility={targetValid ? undefined : 'hidden'}><line x1={GAUGE_CENTER} y1={GAUGE_CENTER - GAUGE_RADIUS + 7.5} x2={GAUGE_CENTER} y2={GAUGE_CENTER - GAUGE_RADIUS - 7.5} /></g>
            </svg>
            <button className="drink-card__temperature metric__edit-button" type="button" disabled={targetDisabled} aria-label={`Edit steam temperature, current ${enabled ? currentText : 'off'}, target ${targetText}`} onClick={() => {
              if (targetDisabled || !targetEdit) return
              openAdjustment({ ...targetEdit, label: targetEdit.title ?? 'Steam target temperature', value: Number(target.value), unit: '°' })
            }}>
              <span className="drink-card__temperature-pair">
                <span className="drink-card__current metric__reading" aria-hidden="true"><span className="drink-card__current-live"><TemperatureReading value={currentText} /></span><span className="drink-card__current-off">Off</span></span>
                <svg className="drink-card__slash" viewBox="0 0 27 27" aria-hidden="true"><path d="M26.35 .35 .35 26.35" /></svg>
                <span className="drink-card__target metric__reading"><TemperatureReading value={targetText} /></span>
              </span>
              <span className="metric__label">Temperature{!targetDisabled && <span className="metric__edit-indicator" aria-hidden="true">›</span>}</span>
            </button>
          </div>
          </div>
          <div className="drink-card__steam-secondary"><div>{displayMetric('Flow')}</div><div>{displayMetric('Duration', 'Max duration')}</div></div>
        </div>}
    </div>
  </section>
}
