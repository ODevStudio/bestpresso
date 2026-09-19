import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const common = {
  "common.metric.volume": "Volume",
  "common.metric.temperature": "Temperatura",
  "common.metric.current": "attuale",
  "common.metric.target": "Obiettivo",
  "common.metric.flow": "Flusso",
  "common.metric.weight": "Peso",
  "common.utility.water": "Acqua calda",
  "common.utility.steam": "Vapore",
  "common.utility.scale": "Bilancia",
  "common.language.label": "Lingua"
} satisfies Translation<EnglishCatalog>

