import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const brew = {
  "brew.metric.pressure": "压力",
  "brew.metric.flowRate": "流速",
  "brew.metric.grindSize": "研磨度",
  "brew.stage.extractionFallback": "萃取",
  "brew.liveScreen.espressoFallbackName": "特浓咖啡",
  "brew.panel.doseSuggestion.espresso": "特浓咖啡",
  "brew.panel.carouselAriaLabel": "档案库",
  "brew.liveScreen.stop": "停止",
  "brew.stage.reason.unknown": "未知",
  "brew.data.scale.fallbackName": "重量计",
  "brew.data.label.steamTemperature": "蒸气温度"
} satisfies Translation<EnglishCatalog>

