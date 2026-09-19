import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const brew = {
  "brew.metric.pressure": "Pressione",
  "brew.metric.flowRate": "Velocità di flusso",
  "brew.metric.grindSize": "Grado di macinatura",
  "brew.metric.dose": "Dosaggio",
  "brew.stage.extractionFallback": "Estrazione",
  "brew.stage.cleaningFallbackName": "Pulizia",
  "brew.liveScreen.espressoFallbackName": "espresso",
  "brew.panel.doseSuggestion.espresso": "espresso",
  "brew.panel.carouselAriaLabel": "Profili",
  "brew.liveScreen.stop": "Stop",
  "brew.stage.reason.unknown": "sconosciuto",
  "brew.data.scale.fallbackName": "Bilancia",
  "brew.data.label.steamTemperature": "Temperatura del vapore"
} satisfies Translation<EnglishCatalog>

