import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const library = {
  "library.action.select": "Selezionare",
  "library.action.edit": "Modificare",
  "library.action.delete": "Eliminare",
  "library.action.cancel": "Annulla",
  "library.aria.profilesSection": "Profili",
  "library.column.profile": "PROFILO",
  "library.metric.dose": "Dosaggio",
  "library.detail.category": "Categoria",
  "library.detail.type": "Tipo",
  "library.detail.version": "Versione",
  "library.detail.author": "Autore",
  "library.detail.grindSize": "Grado di macinatura",
  "library.beverageType.espresso": "espresso",
  "library.beverageType.pourover": "Caffè filtro",
  "library.beverageType.cleaning": "Pulizia",
  "library.beverageType.calibrate": "Calibrare",
  "library.beverageType.manual": "manuale"
} satisfies Translation<EnglishCatalog>

