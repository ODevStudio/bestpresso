import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const builder = {
  "builder.axis.pressure": "Pression",
  "builder.axis.flow": "Débit",
  "builder.common.max": "Max",
  "builder.sensor.coffee": "Café",
  "builder.sensor.water": "Eau",
  "builder.stage.maxTimeLabel": "DURÉE MAXIMALE",
  "builder.stage.waterTemperatureLabel": "Température de l'eau",
  "builder.stage.transitionLabel": "transition",
  "builder.profile.categoryLabel": "Catégorie",
  "builder.profile.typeLabel": "Type",
  "builder.actions.cancel": "Annuler",
  "builder.actions.save": "Sauvegarder",
  "builder.beverageType.espresso": "espresso",
  "builder.beverageType.pourover": "Café filtre",
  "builder.beverageType.manual": "manuel",
  "builder.beverageType.cleaning": "Nettoyage",
  "builder.beverageType.calibrate": "Calibrage",
  "builder.validation.profileLabel": "PROFIL",
  "builder.details.authorLabel": "Auteur",
  "builder.details.descriptionLabel": "Description"
} satisfies Translation<EnglishCatalog>

