// Local, read-only HTTP fixture following Decaid's saved-shot response contract.
// Never included in the skin ZIP. Ctrl-C stops it; restart preserves deterministic IDs.
import { createServer } from 'node:http'
const midnight = new Date(); midnight.setHours(0, 0, 0, 0)
const records = Array.from({ length: 120 }, (_, i) => {
  const date = new Date(midnight); date.setDate(date.getDate() - Math.floor(i / 2)); date.setHours(i % 2 ? 7 : 14, i % 60)
  const beverage = i % 17 === 0 ? 'pourover' : i % 23 === 0 ? 'cleaning' : 'espresso'
  return { id: `contract-${i}`, timestamp: date.toISOString(), workflow: { profile: { title: beverage === 'pourover' ? 'Tea concentrate' : beverage === 'cleaning' ? 'Cleaning' : i % 3 ? 'Adaptive V2' : 'Gentle & sweet', beverage_type: beverage, steps: [{ name: 'Fill', seconds: 8, pump: { target: 'flow', flow: 4 } }, { name: 'Extraction', seconds: 40, pump: { target: 'pressure', pressure: 9 } }] }, context: { targetDoseWeight: i % 11 ? 20 : null, targetYield: 40 } }, annotations: i % 13 ? { actualYield: 36 + (i % 6) * .6, actualDoseWeight: 20 } : null, stopReason: i % 3 ? 'targetWeight' : 'apiStop' }
})
const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') { res.writeHead(405); res.end('{}'); return }
  const url = new URL(req.url, 'http://localhost')
  const send = value => res.end(JSON.stringify(value))
  if (url.pathname === '/api/v1/shots') {
    const limit = Math.min(100, Number(url.searchParams.get('limit') ?? 20)); const offset = Number(url.searchParams.get('offset') ?? 0)
    console.log(`GET history limit=${limit} offset=${offset}`)
    return send({ items: records.slice(offset, offset + limit), total: records.length, offset, limit })
  }
  if (url.pathname === '/api/v1/shots/latest') return send(records[0])
  const record = records.find(r => `/api/v1/shots/${r.id}` === url.pathname)
  if (record) {
    console.log(`GET detail ${record.id}`)
    const start = Date.parse(record.timestamp)
    return send({ ...record, measurements: Array.from({ length: 61 }, (_, i) => ({ machine: { timestamp: new Date(start + i * 500).toISOString(), state: { substate: 'pouring' }, profileFrame: i < 16 ? 0 : 1, pressure: i < 16 ? i / 4 : 9 - (i - 16) / 20, flow: i < 16 ? 4 : 2.2, mixTemperature: 92, targetPressure: i < 16 ? 0 : 9, targetFlow: i < 16 ? 4 : 0 }, scale: { weight: (record.annotations?.actualYield ?? 38) * i / 60 } })) })
  }
  res.writeHead(503); send({ error: 'Fixture only serves saved-shot reads; no machine connected.' })
})
server.listen(5391, '127.0.0.1', () => console.log('Read-only Decaid shot fixture on 127.0.0.1:5391'))
