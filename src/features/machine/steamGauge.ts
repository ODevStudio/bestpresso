// The live heater starts cold; its display range is deliberately wider than
// the allowed steam target adjustment range (135–170°C).
export const GAUGE_MIN_C = 40
export const GAUGE_CENTER = 98.5
export const GAUGE_RADIUS = 94
export const GAUGE_SWEEP_DEG = 210
// Symmetrical circular arc, centered on twelve o'clock. Geometry is generated
// from one circle, independent of the hand-drawn design path.
export const GAUGE_START_DEG = 360 - GAUGE_SWEEP_DEG / 2

export function gaugePointAtAngle(angle: number, radius = GAUGE_RADIUS) {
  const radians = angle * Math.PI / 180
  return {
    left: GAUGE_CENTER + radius * Math.sin(radians),
    top: GAUGE_CENTER - radius * Math.cos(radians),
  }
}

export function gaugeArcPath(fraction: number) {
  const progress = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0
  if (progress === 0) return ''
  const sweep = progress * GAUGE_SWEEP_DEG
  const start = gaugePointAtAngle(GAUGE_START_DEG)
  const end = gaugePointAtAngle(GAUGE_START_DEG + sweep)
  return `M ${start.left} ${start.top} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 ${sweep > 180 ? 1 : 0} 1 ${end.left} ${end.top}`
}

export const GAUGE_TRACK_PATH = gaugeArcPath(1)

export function gaugeFraction(value: number, min: number, max: number) {
  if (!Number.isFinite(value) || max <= min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

export function gaugeGeometry(value: number, min: number, max: number) {
  const fraction = gaugeFraction(value, min, max)
  const angle = GAUGE_START_DEG + fraction * GAUGE_SWEEP_DEG
  return {
    fraction,
    angle,
    ...gaugePointAtAngle(angle),
    markerStart: gaugePointAtAngle(angle, GAUGE_RADIUS - 7.5),
    markerEnd: gaugePointAtAngle(angle, GAUGE_RADIUS + 7.5),
  }
}
