import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const insights = {
  "insights.common.retry": "重試",
  "insights.table.profile": "配方",
  "insights.nav.history": "歷史",
  "insights.drink.espresso": "特濃咖啡",
  "insights.previousShot.title": "歷史萃取"
} satisfies Translation<EnglishCatalog>

