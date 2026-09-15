import { MiniShotChart } from '../history/MiniShotChart'
import { parseProfileTitle } from '../../api/decaid/adapters'
import { latestChartMessage } from './latestChartRetry'
import { historyStatus } from './historyStatus'
import type { ShotInsights } from './useShotInsights'
import { calendarParts, coversWindow, dateLabel, inWindow, reportingWindow, shiftDate, shotRecipeLabel, summarize, timeLabel, weekdays } from './historyData'

export function InsightsHome({ data, onOpen, onLatest }: { data: ShotInsights; onOpen: () => void; onLatest: (id: string) => void }) {
  const cache = data.cache
  const timezone = cache?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const window = reportingWindow(7, timezone, data.now, false, true)
  const shots = cache?.records.filter(r => r.beverage === 'espresso' && inWindow(r, window)) ?? []
  const latest = cache?.records.find(r => r.beverage !== 'excluded')
  const latestName = latest ? parseProfileTitle(latest.profile).name : 'Brew history'
  const detail = latest && cache?.details[latest.id]
  const summary = summarize(shots)
  const complete = coversWindow(cache, window, data.now)
  const daily = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(window.start, i)
    const weekday = calendarParts(`${date}T12:00:00Z`, 'UTC')!.weekday
    return { date, name: weekdays[weekday], count: shots.filter(s => s.date === date).length }
  })
  const max = Math.max(1, ...daily.map(d => d.count))
  const status = historyStatus(!!cache, !!data.error, complete)
  return <section className="ins-theme ins-home-entry" aria-label="Brewing insights and latest shot">
    <button className="ins-entry-card ins-entry-insight" onClick={onOpen} aria-label="Open brewing insights" aria-describedby="ins-home-period-context">
      <span id="ins-home-period-context" className="ins-sr">Espresso brews from today and the previous six days. Today is still in progress. Average yield uses {summary.yieldCoverage} of {summary.count} saved readings.</span>
      <div className="ins-entry-content">
      <div className="ins-entry-week" role="img" aria-label={daily.map(d => `${d.name} ${dateLabel(d.date)}: ${d.count} cached shots`).join('; ')}>
        {daily.map(d => <span className="ins-entry-day" key={d.date} aria-hidden="true"><span className="ins-entry-bar-space"><i data-empty={!d.count} style={{ height: `${d.count ? d.count / max * 100 : 2}%` }}/></span><small>{d.name[0]}</small></span>)}
      </div>
      <div className="ins-entry-summary"><strong>Past 7 days<br/>{' '}insight</strong><span className="ins-entry-metric"><span>{cache ? summary.count : '—'}</span><small>{complete ? 'Shots' : 'Cached shots'}</small></span><span className="ins-entry-metric"><span>{summary.averageYield?.toFixed(1) ?? '—'}{summary.averageYield !== null && <small className="ins-entry-unit"> g</small>}</span><small>Avg. yield</small></span></div>
      {status && <span className="ins-entry-status">{status}</span>}
      </div>
    </button>
    <button className="ins-entry-card ins-entry-latest" onClick={() => latest ? onLatest(latest.id) : onOpen()} aria-label={latest ? `Open latest shot: ${latestName}` : 'Open brew history'}>
      <div className="ins-entry-latest-content">
      <div className="ins-entry-shot-chart">{detail?.points?.length ? <MiniShotChart shot={detail}/> : <span className="ins-entry-placeholder" role="status">{latest ? latestChartMessage(data.latestChartStatus) : cache ? 'No saved brews yet' : 'Waiting for saved history'}</span>}</div>
      {latest && <span className="ins-entry-recipe">{shotRecipeLabel(latest)}</span>}
      <div className="ins-entry-shot-caption"><strong>{latestName}</strong><time dateTime={latest?.timestamp}>{latest ? `${dateLabel(latest.date)}, ${timeLabel(latest)}` : 'Saved in Decaid'}</time></div>
      </div>
    </button>
  </section>
}
