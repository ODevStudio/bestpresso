import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const brew = {
  "brew.metric.pressure": "Pression",
  "brew.metric.flowRate": "Débit",
  "brew.metric.grindSize": "Taille de la mouture",
  "brew.metric.dose": "Dosage",
  "brew.stage.extractionFallback": "Extraction",
  "brew.stage.cleaningFallbackName": "Nettoyage",
  "brew.liveScreen.espressoFallbackName": "espresso",
  "brew.panel.doseSuggestion.espresso": "espresso",
  "brew.panel.carouselAriaLabel": "Profils",
  "brew.liveScreen.stop": "Arrêter",
  "brew.stage.reason.unknown": "inconnu",
  "brew.data.scale.fallbackName": "Balance",
  "brew.data.label.steamTemperature": "Température de la vapeur"
} satisfies Translation<EnglishCatalog>

