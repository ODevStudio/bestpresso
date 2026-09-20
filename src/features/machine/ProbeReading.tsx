import { useSyncExternalStore } from 'react'
import { getProbeTemperature, subscribeProbe } from './probeStore'
import { formatTemperatureValue, temperatureUnitLabel } from '../../domain/temperature'
import { useBestpressoPreferences } from '../settings/bestpressoPreferences'
import { t } from '../../i18n/index.ts'

export function ProbeReading() {
  const value = useSyncExternalStore(subscribeProbe, getProbeTemperature)
  const { preferences } = useBestpressoPreferences()
  if (value === undefined) return null
  return <p className="probe-reading">{t('hardware.sensor')}: {formatTemperatureValue(value, preferences.temperatureUnit)} {temperatureUnitLabel(preferences.temperatureUnit)}</p>
}
