import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const insights = {
  "insights.common.retry": "Réessayer",
  "insights.table.profile": "PROFIL",
  "insights.table.dose": "Dosage",
  "insights.nav.history": "HISTORIQUE",
  "insights.drink.espresso": "espresso",
  "insights.previousShot.title": "HISTORIQUE DES CAFÉS"
} satisfies Translation<EnglishCatalog>

