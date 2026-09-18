import type { commonEn } from '../en/common.ts'
import type { Translation } from '../types.ts'

export const commonDe = {
  'common.metric.volume': 'Volumen',
  'common.metric.temperature': 'Temperatur',
  'common.metric.maxDuration': 'Max. Dauer',
  'common.metric.current': 'Aktuell',
  'common.metric.target': 'Ziel',
  'common.metric.duration': 'Dauer',
  'common.metric.flow': 'Durchfluss',
  'common.metric.weight': 'Gewicht',
  'common.utility.water': 'Heißwasser',
  'common.utility.steam': 'Dampf',
  'common.utility.scale': 'Waage',
  'common.utility.tank': 'Wassertank',
  'common.language.label': 'Sprache',
  'common.language.hint': 'Nur Bestpresso; Decaid und Profilnamen bleiben unverändert',
  'common.language.auto': 'Wie Gerät ({language})',
  'common.language.en': 'English',
  'common.language.de': 'Deutsch',
} satisfies Translation<typeof commonEn>
