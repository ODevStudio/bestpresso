import { createServer } from 'node:http'
import { createHash } from 'node:crypto'

let model = 'Bengle'
let connected = true
let sensor = true
let currentLevel = 50
let refillKit = false
let state = 'idle'
let failPath = ''
let warmer = { temperature: 60, enabled: false, currentTemperature: 25 }
let preheat = { enabled: false, leadMinutes: 15, active: false }
const initialPalette = { frontStrip: { awake: 'FFFF00000000', sleeping: '000000000000' }, backStrip: { awake: '0000FFFF0000', sleeping: '000000000000' }, frontSwitch: { awake: 'FFFF00000000', sleeping: 'FFFFFFFFFFFF' } }
let palette = initialPalette
let calibration = { step: 'idle', detectedCell: 'none', subState: 'done', secondsRemaining: 0, status: 'ok' }
let settings = { stopHotWaterAtWeight: true }
const profile = { title: 'Fixture espresso', beverage_type: 'espresso', target_weight: 36, steps: [{ name: 'Pour', temperature: 92, seconds: 30, pressure: 9, flow: 2 }] }
let workflow = { profile, context: { targetYield: 36, targetDoseWeight: 18 }, hotWaterData: { targetTemperature: 60, volume: 20, duration: 30, flow: 7 }, steamSettings: { targetTemperature: 150, duration: 50, flow: 0.7 } }
let writes = []
const sockets = new Map()
const capabilities = ['cupWarmer', 'integratedScale', 'stopAtWeight', 'ledStrip', 'scaleCalibration', 'preheat', 'wakeSchedule']
const send = (socket, data) => {
  if (socket.destroyed) return
  const body = Buffer.from(JSON.stringify(data))
  const header = body.length < 126 ? Buffer.from([0x81, body.length]) : Buffer.from([0x81, 126, body.length >> 8, body.length & 255])
  socket.write(Buffer.concat([header, body]))
}
const snapshot = () => ({ timestamp: new Date().toISOString(), state: { state, substate: state === 'idle' ? 'ready' : 'pouring' }, mixTemperature: 92, groupTemperature: 92, targetMixTemperature: 92, steamTemperature: 150, pressure: 0, flow: 0, weightFlow: 2.5 })
const emit = () => {
  for (const [socket, path] of sockets) {
    if (!connected) continue
    if (path === '/ws/v1/machine/snapshot') send(socket, snapshot())
    if (path === '/ws/v1/machine/waterLevels') send(socket, { currentLevel, refillLevel: 10 })
    if (path === '/ws/v1/scale/snapshot') send(socket, { weight: 10, weightFlow: 1, status: 'connected' })
    if (path.startsWith('/ws/v1/sensors/') && sensor) send(socket, { timestamp: new Date().toISOString(), temperature: 42 })
    if (path === '/ws/v1/machine/shotSettings') send(socket, { targetHotWaterVolume: workflow.hotWaterData.volume, targetHotWaterTemp: workflow.hotWaterData.targetTemperature, targetHotWaterDuration: workflow.hotWaterData.duration })
  }
}
const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
  response.setHeader('Content-Type', 'application/json')
  const reply = (data, status = 200) => { response.writeHead(status); response.end(JSON.stringify(data)) }
  if (request.method === 'OPTIONS') return reply(null, 204)
  const path = new URL(request.url, 'http://localhost').pathname
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString()
  const body = raw ? JSON.parse(raw) : {}
  if (path === '/test-state') return reply({ model, connected, warmer, preheat, palette, calibration, writes, sockets: [...sockets.values()] })
  if (path === '/test-control' && request.method === 'POST') {
    if (body.reset) {
      palette = initialPalette
      warmer = { temperature: 60, enabled: false, currentTemperature: 25 }
      preheat = { enabled: false, leadMinutes: 15, active: false }
      calibration = { step: 'idle', detectedCell: 'none', subState: 'done', secondsRemaining: 0, status: 'ok' }
      writes = []
    }
    model = body.model ?? model
    connected = body.connected ?? connected
    sensor = body.sensor ?? sensor
    currentLevel = body.currentLevel ?? currentLevel
    refillKit = body.refillKit ?? refillKit
    state = body.state ?? state
    failPath = body.failPath ?? failPath
    if (body.powerCycle) warmer = { ...warmer, enabled: false }
    emit()
    return reply({})
  }
  if (path === failPath) return reply({}, 503)
  if (request.method !== 'GET') writes = [...writes, { path, body }]
  if (path === '/api/v1/devices') return reply(connected ? [{ id: model.toLowerCase(), name: `Fixture ${model}`, type: 'machine', state: 'connected' }] : [])
  if (path === '/api/v1/machine/info') return reply({ model, version: 'fixture', extra: { refillKit } })
  if (path === '/api/v1/machine/capabilities') return reply({ capabilities: model === 'Bengle' ? capabilities : [] })
  if (path === '/api/v1/machine/cupWarmer') {
    if (request.method === 'PUT') warmer = { ...warmer, ...body }
    return reply(warmer)
  }
  if (path === '/api/v1/machine/cupWarmer/preheat') {
    if (request.method === 'PUT') preheat = { ...preheat, ...body }
    return reply(preheat)
  }
  if (path === '/api/v1/machine/ledStrip') {
    if (request.method === 'PUT') palette = { ...palette, ...body }
    return reply(palette)
  }
  if (path === '/api/v1/machine/scaleCalibration') {
    if (request.method === 'PUT') {
      if (state !== 'idle') return reply({ status: 'rejected', reason: 'busy', state: calibration }, 409)
      calibration = { ...calibration, step: body.command === 'abort' ? 'idle' : body.command === 'zero' ? 'zeroing' : 'calLatch', subState: body.command === 'abort' ? 'done' : 'settling', secondsRemaining: body.command === 'abort' ? 0 : 3, status: 'none' }
      return reply({ status: 'accepted', state: calibration }, 202)
    }
    return reply(calibration)
  }
  if (path === '/api/v1/sensors') return reply(sensor ? [{ name: 'Fixture probe', info: { id: 'probe:a/b', dataChannels: [{ key: 'temperature', type: 'number' }] } }] : [])
  if (path === '/api/v1/settings') { settings = { ...settings, ...body }; return reply(settings) }
  if (path === '/api/v1/workflow') {
    workflow = { ...workflow, ...body, hotWaterData: { ...workflow.hotWaterData, ...body.hotWaterData }, steamSettings: { ...workflow.steamSettings, ...body.steamSettings } }
    return reply(workflow)
  }
  if (path === '/api/v1/shots') return reply({ items: [], total: 0 })
  if (path === '/api/v1/shots/latest') return reply(null)
  if (path === '/api/v1/profiles') return reply([{ id: 'fixture', profile, isDefault: false, visibility: 'visible' }])
  if (path === '/api/v1/plugins') return reply([])
  if (path === '/api/v1/info') return reply({ version: 'fixture-only', commitShort: 'fixture' })
  return reply({})
})
server.on('upgrade', (request, socket) => {
  const accept = createHash('sha1').update(request.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
  sockets.set(socket, request.url)
  socket.on('error', () => sockets.delete(socket))
  socket.on('close', () => sockets.delete(socket))
  socket.on('data', data => { if ((data[0] & 15) === 8) socket.end(Buffer.from([0x88, 0])) })
  emit()
})
setInterval(() => {
  if (calibration.secondsRemaining > 0) {
    calibration = { ...calibration, secondsRemaining: calibration.secondsRemaining - 1 }
    if (!calibration.secondsRemaining) calibration = { ...calibration, step: 'complete', subState: 'done', detectedCell: 'a', status: 'ok' }
  }
  emit()
}, 500)
server.listen(5396, '127.0.0.1', () => console.log('Bengle fixture: http://127.0.0.1:5396'))
