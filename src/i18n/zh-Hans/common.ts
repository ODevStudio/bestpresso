import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const common = {
  "common.metric.volume": "容量",
  "common.metric.temperature": "温度",
  "common.metric.current": "当前",
  "common.metric.target": "目标",
  "common.metric.flow": "流量",
  "common.metric.weight": "重量",
  "common.utility.water": "热水",
  "common.utility.steam": "蒸汽",
  "common.utility.scale": "重量计",
  "common.language.label": "语言"
} satisfies Translation<EnglishCatalog>

