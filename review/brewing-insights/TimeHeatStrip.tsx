import { useState, type CSSProperties } from 'react'
import { timeWindows, timeWindowCounts, type InsightShot } from './data'

interface TimeHeatStripProps {
  current: InsightShot[]
  previous: InsightShot[]
  onOpen: (window: number, previous: boolean) => void
}

export function TimeHeatStrip({ current, previous, onOpen }: TimeHeatStripProps) {
  const counts = [timeWindowCounts(current), timeWindowCounts(previous)]
  const maximum = Math.max(1, ...counts.flat())
  const [selection, setSelection] = useState(() => ({
    period: 0,
    window: counts[0].indexOf(Math.max(...counts[0])),
  }))
  const periodNames = ['This period', 'Previous']
  const selectedCount = counts[selection.period][selection.window]
  const selectedWindow = timeWindows[selection.window]

  return <section className="ins-panel ins-time-panel" aria-label="Brewing across 24 hours">
    <header><div><h2>When you brew</h2><p>24 hours · Two-hour windows</p></div></header>
    <div className="ins-heat-rows">
      {counts.map((period, periodIndex) => <div key={periodIndex} className="ins-heat-row">
        <span className="ins-heat-row-label">{periodNames[periodIndex]}</span>
        <div className="ins-heat-strip" role="group" aria-label={periodNames[periodIndex]}>
          {period.map((count, index) => <button key={index} type="button"
            aria-label={`${periodNames[periodIndex]}, ${timeWindows[index].label}: ${count} ${count === 1 ? 'brew' : 'brews'}`}
            aria-pressed={selection.period === periodIndex && selection.window === index}
            onClick={() => setSelection({ period: periodIndex, window: index })}>
            <span aria-hidden="true" style={{ '--heat-fill': `${count ? 22 + 78 * count / maximum : 0}%` } as CSSProperties}/>
          </button>)}
        </div>
      </div>)}
    </div>
    <div className="ins-heat-axis" aria-hidden="true">{['00', '06', '12', '18', '24'].map(hour => <span key={hour}>{hour}</span>)}</div>
    <div className="ins-heat-key"><span>Fewer</span><i/><i/><i/><i/><span>More brews</span><small>Same scale</small></div>
    <div className="ins-heat-selection">
      <div aria-live="polite"><span>{selectedWindow.label} <small>· {periodNames[selection.period]}</small></span><strong>{selectedCount} <small>{selectedCount === 1 ? 'brew' : 'brews'}</small></strong></div>
      <button className="ins-link" onClick={() => onOpen(selection.window, selection.period === 1)}>View brews ↗</button>
    </div>
  </section>
}
