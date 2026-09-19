import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const insights = {
  "insights.common.retry": "Riprovare",
  "insights.table.profile": "PROFILO",
  "insights.table.dose": "Dosaggio",
  "insights.nav.history": "CRONOLOGIA",
  "insights.drink.espresso": "espresso",
  "insights.previousShot.title": "CRONOLOGIA DEGLI ESPRESSI"
} satisfies Translation<EnglishCatalog>

