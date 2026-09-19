import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const library = {
  "library.action.select": "Sélectionner",
  "library.action.edit": "Modifier",
  "library.action.delete": "Supprimer",
  "library.action.cancel": "Annuler",
  "library.aria.profilesSection": "Profils",
  "library.column.profile": "PROFIL",
  "library.metric.dose": "Dosage",
  "library.detail.category": "Catégorie",
  "library.detail.type": "Type",
  "library.detail.version": "Version",
  "library.detail.author": "Auteur",
  "library.detail.grindSize": "Taille de la mouture",
  "library.beverageType.espresso": "espresso",
  "library.beverageType.pourover": "Café filtre",
  "library.beverageType.cleaning": "Nettoyage",
  "library.beverageType.calibrate": "Calibrage",
  "library.beverageType.manual": "manuel"
} satisfies Translation<EnglishCatalog>

