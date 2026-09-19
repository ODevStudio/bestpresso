import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const common = {
  "common.metric.volume": "容量",
  "common.metric.temperature": "溫度",
  "common.metric.current": "當前",
  "common.metric.target": "目標",
  "common.metric.flow": "流量",
  "common.metric.weight": "重量",
  "common.utility.water": "熱水",
  "common.utility.steam": "蒸汽",
  "common.utility.scale": "重量計",
  "common.language.label": "語言"
} satisfies Translation<EnglishCatalog>

