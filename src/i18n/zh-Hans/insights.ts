import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const insights = {
  "insights.common.retry": "重试",
  "insights.table.profile": "配方",
  "insights.nav.history": "历史",
  "insights.drink.espresso": "特浓咖啡",
  "insights.previousShot.title": "历史萃取"
} satisfies Translation<EnglishCatalog>

