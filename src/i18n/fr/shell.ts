import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const shell = {
  "shell.appShell.sleep": "Veille",
  "shell.appShell.cleaning": "Nettoyage",
  "shell.appShell.settings": "paramètres",
  "shell.status.ready": "Prêt",
  "shell.status.heating": "chauffe",
  "shell.status.disconnected": "Déconnecté",
  "shell.status.connecting": "Connexion en cours",
  "shell.status.sourceMachine": "Machine",
  "shell.fullscreen.recommendedTitle": "Mode plein écran recommandé",
  "shell.fullscreen.enter": "Passer en mode plein écran",
  "shell.adjust.grindSetting.title": "Taille de la mouture",
  "shell.adjust.dose.title": "Dosage",
  "shell.adjust.builderPressure.title": "Pression",
  "shell.adjust.builderFlow.title": "Débit",
  "shell.adjust.builderTemperature.title": "Température",
  "shell.adjust.builderDuration.title": "DURÉE MAXIMALE",
  "shell.adjust.cancel": "Annuler",
  "shell.adjust.save": "Sauvegarder",
  "shell.machine.steamTemperatureAria": "Température de la vapeur",
  "shell.machine.off": "off",
  "shell.machine.offLower": "off",
  "shell.scale.search": "Rechercher",
  "shell.liveOperation.steaming": "Production de vapeur",
  "shell.cleaning.title": "Nettoyage",
  "shell.brewStage.extraction": "Extraction"
} satisfies Translation<EnglishCatalog>

