import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const common = {
  "common.metric.volume": "Volume",
  "common.metric.temperature": "Température",
  "common.metric.current": "actuel",
  "common.metric.target": "Cible",
  "common.metric.flow": "Débit",
  "common.metric.weight": "Poids",
  "common.utility.water": "Eau chaude",
  "common.utility.steam": "Vapeur",
  "common.utility.scale": "Balance",
  "common.language.label": "Langue"
} satisfies Translation<EnglishCatalog>

