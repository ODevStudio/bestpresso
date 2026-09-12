import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('overview charts precede the summary and use open sections instead of cards', () => {
  const preview = read('../review/brewing-insights/preview.tsx')
  const timeChart = read('../review/brewing-insights/TimeCoxcomb.tsx')
  assert.ok(preview.indexOf('className="ins-top-grid"') < preview.indexOf('aria-label="Period summary"'))
  assert.match(preview, /className="ins-top-grid"><section className="ins-chart-section"/)
  assert.match(timeChart, /className="ins-chart-section ins-time-panel"/)
  assert.doesNotMatch(preview, /Your weekly rhythm|Tap a day to see|Brews by day of the week/)
  assert.match(preview, /<h2>By day<\/h2>/)
  assert.match(timeChart, /<h2>By hour<\/h2>/)
})

test('Insights and Settings share the brand/close and selected navigation components', () => {
  const preview = read('../review/brewing-insights/preview.tsx')
  const settings = read('../src/features/settings/SettingsScreen.tsx')
  for (const source of [preview, settings]) {
    assert.match(source, /<SidebarBrand /)
    assert.match(source, /<SidebarNavItem active=/)
  }
  const nav = read('../src/components/Sidebar/SidebarNavigation.tsx')
  assert.match(nav, /aria-current=\{active \? 'page' : undefined\}/)
  assert.match(nav, /aria-label=\{closeLabel\}/)
})

test('standalone detail omits the history rail without changing the legacy browser default', () => {
  const screen = read('../src/features/history/PreviousShotScreen.tsx')
  const css = read('../src/styles/index.css')
  assert.match(screen, /layout = 'browser'/)
  assert.match(screen, /layout === 'browser' && <aside className="history-browser-rail"/)
  assert.match(css, /\.history-browser-screen--detail \{ --history-column-gap:0px; grid-template-columns:minmax\(0,1fr\); \}/)
})

test('Insights details use standalone layout and close back to the list, preserving list state', () => {
  const preview = read('../review/brewing-insights/preview.tsx')
  assert.match(preview, /<PreviousShotScreen layout="detail"/)
  assert.match(preview, /onDismiss=\{\(\) => \{ setSelected\(null\); setPage\('history'\) \}\}/)
  assert.match(preview, /if \(page === 'history'\) savedScroll.current = scroll.current\?\.scrollTop/)
  assert.match(preview, /if \(!selected && scroll.current\) scroll.current.scrollTop = savedScroll.current/)
})
