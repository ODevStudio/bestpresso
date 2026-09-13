import { useEffect, useRef, useState } from 'react'
import { SidebarBrand, SidebarNavItem } from '../../components/Sidebar/SidebarNavigation'
import { PreviousShotScreen } from '../history/PreviousShotScreen'
import type { PreviousShot } from '../../domain/brewing'
import { coversWindow, dateLabel, HISTORY_LIMIT, inWindow, matches, reportingWindow, shiftDate, summarize, timeLabel, weekdays, type HistoryRecord, type InsightFilter } from './historyData'
import { availableInsightPeriods, constrainInsightsRoute, type InsightsRoute } from './insightsRoute'
import type { ShotInsights } from './useShotInsights'
import { useBestpressoPreferences } from '../settings/bestpressoPreferences'
import { insightHourRange, insightPeriods } from './insightClock'
import { TimeCoxcomb } from './TimeCoxcomb'

const pct = (n: number, total: number) => total ? Math.round(n / total * 100) : 0
const signed = (n: number) => `${n > 0 ? '+' : ''}${n}`
const drinkNames = { espresso: 'Espresso', pourover: 'Pour-over', other: 'Other / unknown', all: 'All recorded activities' }

export function InsightsScreen({ data, route, navigate, onClose }: { data: ShotInsights; route: InsightsRoute; navigate: (next: InsightsRoute, replace?: boolean) => void; onClose: () => void }) {
  const { preferences } = useBestpressoPreferences()
  const { cache, repository } = data
  const periods = availableInsightPeriods(cache, data.now)
  const effectiveRoute = constrainInsightsRoute(route, periods)
  const { days, section, beverage, filter, search, previous, shotId } = effectiveRoute
  // Do not rewrite a valid long-range bookmark while the first sync is loading.
  useEffect(() => {
    if (effectiveRoute !== route && !data.refreshing && (data.status === 'ready' || data.error)) navigate(effectiveRoute, true)
  }, [effectiveRoute, route, data.refreshing, data.status, data.error, navigate])
  const timezone = cache?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const records = cache?.records ?? []
  const eligible = records.filter(r => beverage === 'all' || r.beverage === beverage)
  const window = reportingWindow(days || 7, timezone, data.now)
  const priorWindow = reportingWindow(days || 7, timezone, data.now, true)
  const current = eligible.filter(r => inWindow(r, window))
  const prior = eligible.filter(r => inWindow(r, priorWindow))
  const summary = summarize(current), before = summarize(prior)
  const complete = coversWindow(cache, window)
  const displayedComplete = previous && section === 'history' ? coversWindow(cache, priorWindow) : complete
  const comparison = complete && coversWindow(cache, priorWindow)
  const history = (days === 0 ? eligible : previous ? prior : current).filter(r => matches(r, filter) && r.profile.toLowerCase().includes(search.toLowerCase()))
  const scroll = useRef<HTMLDivElement>(null)
  const savedScroll = useRef(0)
  const [detail, setDetail] = useState<{ id: string; shot: PreviousShot | null; error: string | null } | null>(null)
  const [retry, setRetry] = useState(0)
  const listScope = JSON.stringify([days, beverage, filter, search, previous])
  const [listPage, setListPage] = useState({ scope: listScope, count: 100 })
  const visibleCount = listPage.scope === listScope ? listPage.count : 100
  const cacheAvailable = !!cache
  useEffect(() => {
    if (!shotId) { if (scroll.current) scroll.current.scrollTop = savedScroll.current; return }
    let alive = true
    if (!cacheAvailable) return
    repository.detail(shotId).then(shot => { if (alive) setDetail({ id: shotId, shot, error: null }) }).catch(() => {
      if (alive) setDetail({ id: shotId, shot: null, error: 'This graph isn’t saved on this device yet, or is no longer available. Connect to Decaid and retry.' })
    })
    return () => { alive = false }
  }, [shotId, repository, cacheAvailable, retry])
  const patch = (values: Partial<InsightsRoute>, replace = false) => navigate({ ...effectiveRoute, ...values }, replace)
  const openHistory = (next: InsightFilter = null, earlier = false) => { savedScroll.current = 0; scroll.current?.scrollTo(0, 0); patch({ section: 'history', filter: next, previous: earlier, search: '', shotId: null }) }
  const openShot = (r: HistoryRecord) => { savedScroll.current = section === 'history' ? scroll.current?.scrollTop ?? 0 : 0; setDetail(null); patch({ section: 'history', shotId: r.id }) }
  const displayWindow = previous && section === 'history' ? priorWindow : window
  const includeYear = displayWindow.start.slice(0, 4) !== window.end.slice(0, 4)
  const recordDate = (r: HistoryRecord) => dateLabel(r.date, r.date.slice(0, 4) !== window.end.slice(0, 4))
  const displayPeriod = days === 0 ? `Latest ${records.length.toLocaleString()} saved records` : `${dateLabel(displayWindow.start, includeYear)} – ${dateLabel(shiftDate(displayWindow.end, -1), includeYear)}`
  const filterText = !filter ? 'All brews' : filter.kind === 'weekday' ? weekdays[Number(filter.value)] : filter.kind === 'hours' ? insightHourRange(Number(filter.value), preferences.clockFormat) : records.find(r => r.profileKey === filter.value)?.profile ?? 'Selected profile'
  const syncText = cache ? `${data.status === 'offline' ? 'Offline · ' : ''}Last synced ${new Date(cache.syncedAt).toLocaleString()} · ${records.length.toLocaleString()} of ${cache.total.toLocaleString()} records saved` : data.status === 'loading' ? 'Loading saved history from Decaid…' : `Decaid history is unavailable. Connect to load up to ${HISTORY_LIMIT.toLocaleString()} records.`
  const rows = (shots: HistoryRecord[]) => <div className="ins-table" role="table" aria-label="Recorded brews">
    <div className="ins-table-head" role="row">{['When', 'Profile', 'Dose', 'Yield', 'Duration'].map(label => <span role="columnheader" key={label}>{label}</span>)}<span className="ins-sr" role="columnheader">Analysis</span></div>
    {shots.map(r => <button key={r.id} role="row" className="ins-shot" aria-label={`Analyse ${r.profile}, ${recordDate(r)} at ${timeLabel(r)}`} onClick={() => openShot(r)}><span role="cell">{recordDate(r)}<small>{timeLabel(r)}</small></span><span role="cell">{r.profile}</span><span role="cell">{r.dose ?? '—'}{r.dose !== null && <small className="unit"> g</small>}</span><span role="cell">{r.yield?.toFixed(1) ?? '—'}{r.yield !== null && <small className="unit"> g</small>}</span><span role="cell">{r.duration ?? '—'}{r.duration !== null && <small className="unit"> s</small>}</span><span aria-hidden="true">↗</span></button>)}
    {!shots.length && <p className="ins-empty">{!cache ? 'History will appear once Decaid is connected.' : 'No saved brews match this view.'}</p>}
  </div>
  if (shotId) {
    const selected = detail?.id === shotId ? detail : null
    return <div className="ins-theme ins-app ins-detail">{selected?.shot ? <><PreviousShotScreen key={shotId} layout="detail" shots={[selected.shot]} initialShot={selected.shot} status="loaded" onSelectShot={id => repository.detail(id)} onDismiss={() => patch({ shotId: null, section: 'history' }, true)}/>{data.status === 'offline' && <span className="ins-detail-banner">Offline · saved graph</span>}</> : <div className="ins-detail-state"><h1>{records.find(r => r.id === shotId)?.profile ?? 'Shot detail'}</h1><p role="status">{selected?.error ?? (data.status === 'offline' && !cache ? 'Connect to Decaid to load this shot.' : 'Loading recorded shot…')}</p>{selected?.error && <button onClick={() => { setDetail(null); setRetry(v => v + 1) }}>Retry</button>}<button onClick={() => patch({ shotId: null, section: 'history' }, true)}>Close</button></div>}</div>
  }
  const top = summary.profileCounts[0]
  const oldTop = top && before.profileCounts.find(p => p.key === top.key)
  const shift = top ? pct(top.count, summary.count) - pct(oldTop?.count ?? 0, before.count) : 0
  const story = comparison && summary.count >= 10 && before.count >= 10 && top && top.count >= 5 && shift >= 15
  return <div className="ins-theme ins-app"><div className="ins-shell"><aside className="ins-rail"><SidebarBrand onClose={onClose} closeLabel="Close insights"/><small className="ins-eyebrow">YOUR BREWING</small><nav aria-label="Insights navigation"><SidebarNavItem active={section === 'overview'} onClick={() => { savedScroll.current = 0; patch({ section: 'overview', days: days || 7, filter: null, previous: false, beverage: beverage === 'all' ? 'espresso' : beverage }) }}><span aria-hidden="true">◫</span> Overview</SidebarNavItem><SidebarNavItem active={section === 'history'} onClick={() => openHistory()}><span aria-hidden="true">◷</span> History</SidebarNavItem></nav><div className="ins-rail-foot">Saved in Decaid<small>Latest {HISTORY_LIMIT.toLocaleString()} records<br/>Cached on this device</small></div></aside>
    <div className="ins-content" ref={scroll}><header className="ins-heading"><div><h1>{section === 'overview' ? 'Your brewing' : 'Brew history'}</h1><p>{displayPeriod} · {drinkNames[beverage]}</p></div><div className="ins-heading-controls"><label className="ins-period"><span className="ins-sr">Drink type</span><select value={beverage} onChange={e => patch({ beverage: e.target.value as InsightsRoute['beverage'], filter: null })}><option value="espresso">Espresso</option><option value="pourover">Pour-over</option><option value="other">Other / unknown</option>{section === 'history' && <option value="all">All activities</option>}</select></label><label className="ins-period"><span className="ins-sr">Period</span><select value={days} onChange={e => patch({ days: Number(e.target.value) as InsightsRoute['days'], filter: null, previous: false })}>{periods.map(days => <option key={days} value={days}>Last {days} days</option>)}{section === 'history' && <option value="0">All cached history</option>}</select></label></div></header>
      <div className="ins-sync"><div><p role="status">{syncText}</p>{data.storageWarning && <p>Offline storage is unavailable. This session’s data may not survive closing the app.</p>}{days !== 0 && !displayedComplete && <p>Limited date coverage — showing cached records, not a complete period.</p>}{section === 'overview' && !comparison && <p>Not enough history for comparison.</p>}</div><button className="ins-link" disabled={data.refreshing} onClick={() => void repository.refresh(true)}>{data.refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
      {section === 'overview' ? <>
        <div className="ins-top-grid"><section className="ins-chart-section"><header><h2>By day</h2><div className="ins-legend"><span><i/>{insightPeriods(days)[0]}</span>{comparison && <span><i/>{insightPeriods(days)[1]}</span>}</div></header><div className="ins-week" aria-label="Brews by weekday">{weekdays.map((name, i) => { const max = Math.max(1, ...summary.weekdays, ...(comparison ? before.weekdays : [])); return <button key={name} onClick={() => openHistory({ kind: 'weekday', value: String(i) })} aria-label={`${name}: ${summary.weekdays[i]} cached brews.${comparison ? ` Previous ${days} days: ${before.weekdays[i]}.` : ''} View shots`}><span className="ins-week-value">{comparison && <span className="ins-week-previous">{before.weekdays[i]}</span>}<span>{cache ? summary.weekdays[i] : '—'}</span></span><span className="ins-bar-pair">{comparison ? <i data-empty={before.weekdays[i] === 0} style={{ height: `${before.weekdays[i] / max * 100}%` }}/> : <i style={{ visibility: 'hidden' }}/>}<b data-empty={summary.weekdays[i] === 0} style={{ height: `${summary.weekdays[i] / max * 100}%` }}/></span><small>{name}</small></button> })}</div></section><TimeCoxcomb days={days} key={`${days}-${beverage}-${comparison}`} current={current} previous={comparison ? prior : []} comparison={comparison} onOpen={(i, earlier) => openHistory({ kind: 'hours', value: String(i) }, earlier)}/></div>
        <section className="ins-metrics" aria-label="Period summary"><div><label>Brews</label><strong>{cache ? summary.count : '—'}</strong><small>{comparison ? `${signed(summary.count - before.count)} vs previous ${days} days` : 'Cached records only'}</small></div><div><label>Brewing days</label><strong>{cache ? summary.days : '—'}<em> / {days}</em></strong><small>A day with at least one brew</small></div><div><label>Typical yield</label><strong>{summary.typicalYield?.toFixed(1) ?? '—'}{summary.typicalYield !== null && <em> g</em>}</strong><small>{summary.typicalYield === null ? 'Needs 5 yield readings' : `${summary.yieldCoverage}/${summary.count} readings`}</small></div><div><label>Most-used profile</label><strong className="ins-profile-value">{top?.name ?? '—'}</strong><small>{top ? `${top.count} brews · ${pct(top.count, summary.count)}%` : 'No brews in this view'}</small></div></section>
        <div className="ins-bottom-grid"><section className="ins-panel"><header><div><h2>Profiles you return to</h2><p>Grouped by profile name</p></div><button className="ins-link" onClick={() => openHistory()}>All brews ↗</button></header><div className="ins-profiles">{summary.profileCounts.map(p => <button key={p.key} onClick={() => openHistory({ kind: 'profile', value: p.key })}><span>{p.name}<small>{p.count} brews · {pct(p.count, summary.count)}%</small></span><span className="ins-track"><i style={{ width: `${pct(p.count, summary.count)}%` }}/></span><span aria-hidden="true">↗</span></button>)}</div></section><section className="ins-story"><small className="ins-eyebrow">{story ? 'WHAT’S CHANGING' : 'YOUR PATTERN'}</small><h2>{story ? 'A new go-to is taking shape.' : summary.count ? 'Your brewing, one shot at a time.' : 'Your next brew starts the story.'}</h2><p>{story ? `${top.name} appears in ${pct(top.count, summary.count)}% of this period’s brews, up from ${pct(oldTop?.count ?? 0, before.count)}%.` : 'Explore the recorded brews behind these numbers. Comparisons appear when both periods are covered.'}</p><small>{summary.count} cached brews · {displayPeriod}</small><button className="ins-link" onClick={() => openHistory(story ? { kind: 'profile', value: top.key } : null)}>Explore these brews ↗</button></section></div>
        <section className="ins-panel ins-recent"><header><h2>Behind the numbers</h2><button className="ins-link" onClick={() => openHistory()}>View all history ↗</button></header>{rows(current.slice(0, 3))}</section>
      </> : <><div className="ins-history-toolbar"><div><span className="ins-filter">{filterText}{filter && <button aria-label="Clear insight filter" onClick={() => patch({ filter: null })}>×</button>}</span>{days !== 0 && comparison && <div className="ins-evidence-switch"><button aria-pressed={!previous} onClick={() => patch({ previous: false })}>{insightPeriods(days)[0]}</button><button aria-pressed={previous} onClick={() => patch({ previous: true })}>{insightPeriods(days)[1]}</button></div>}</div><label><span className="ins-sr">Search profiles</span><input placeholder="Search profiles" value={search} onChange={e => patch({ search: e.target.value }, true)}/></label></div><section className="ins-panel ins-history-list"><header><div><h2>{history.length} recorded brews</h2><p>{summarize(history).yieldCoverage} with yield readings</p></div><small>Tap a brew to analyse ↗</small></header>{rows(history.slice(0, visibleCount))}{history.length > visibleCount && <div className="ins-load-more"><span>{visibleCount} of {history.length} shown</span><button className="ins-link" onClick={() => setListPage({ scope: listScope, count: visibleCount + 100 })}>Show more brews</button></div>}</section></>}
      <p className="ins-footnote">Read-only · {timezone} · Dose comes from the saved shot, and may be a target rather than a measured dose. Duration and older missing yield load with the graph. Known cleaning/calibration records are excluded from drink totals; older records may not identify simulation. {cache?.omitted ? `${cache.omitted} records lack a usable date or ID.` : ''}</p>
    </div></div></div>
}
