import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const builder = {
  "builder.axis.pressure": "Pressione",
  "builder.axis.flow": "Flusso",
  "builder.common.max": "Max",
  "builder.sensor.coffee": "Caffè",
  "builder.sensor.water": "Acqua",
  "builder.stage.maxTimeLabel": "DURATA MASSIMA",
  "builder.stage.waterTemperatureLabel": "Temperatura dell'acqua",
  "builder.stage.transitionLabel": "transizione",
  "builder.profile.categoryLabel": "Categoria",
  "builder.profile.typeLabel": "Tipo",
  "builder.actions.cancel": "Annulla",
  "builder.actions.save": "Salva",
  "builder.beverageType.espresso": "espresso",
  "builder.beverageType.pourover": "Caffè filtro",
  "builder.beverageType.manual": "manuale",
  "builder.beverageType.cleaning": "Pulizia",
  "builder.beverageType.calibrate": "Calibrare",
  "builder.validation.profileLabel": "PROFILO",
  "builder.details.authorLabel": "Autore",
  "builder.details.descriptionLabel": "Descrizione"
} satisfies Translation<EnglishCatalog>

