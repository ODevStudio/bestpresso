import assert from 'node:assert/strict'
import test from 'node:test'
import { machineSession } from '../src/features/machine/machineSession.ts'
import { subscribe } from '../src/api/decaid/machineSocket.ts'

test('machine-bound subscriptions replace surviving sockets and ignore old events', () => {
  const originalWindow = globalThis.window
  const originalSocket = globalThis.WebSocket
  const sockets: FakeSocket[] = []
  class FakeSocket extends EventTarget {
    url: string
    closed = false
    constructor(url: string) { super(); this.url = url; sockets.push(this) }
    close() { this.closed = true; this.dispatchEvent(new Event('close')) }
    open() { this.dispatchEvent(new Event('open')) }
    frame(value: unknown) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(value) })) }
  }
  Object.assign(globalThis, { window: { location: { search: '', protocol: 'http:', hostname: 'localhost' }, setTimeout, clearTimeout }, WebSocket: FakeSocket })
  machineSession.connect(undefined)
  const received: unknown[] = []
  const water = subscribe('/machine/waterLevels', frame => received.push(frame), () => {})
  const machine = subscribe('/machine/snapshot', () => {}, () => {})
  try {
    assert.equal(sockets.length, 0)
    machineSession.connect('bengle')
    assert.equal(sockets.length, 2)
    const originalWater = sockets[0]
    originalWater.open()
    sockets[1].open()
    originalWater.frame({ currentLevel: 50 })
    machineSession.connect('de1')
    assert.equal(sockets.length, 4)
    assert.equal(originalWater.closed, true)
    originalWater.frame({ currentLevel: 60 })
    sockets[2].frame({ currentLevel: 20 })
    assert.deepEqual(received, [{ currentLevel: 50 }, { currentLevel: 20 }])
    sockets[3].open()
    sockets[3].dispatchEvent(new Event('close'))
    assert.equal(sockets.length, 6)
    assert.equal(sockets[2].closed, true)
    machineSession.connect(undefined)
    assert.equal(sockets.every(socket => socket.closed), true)
  } finally {
    water.close(); machine.close(); machineSession.connect(undefined)
    Object.assign(globalThis, { window: originalWindow, WebSocket: originalSocket })
  }
})
