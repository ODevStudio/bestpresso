import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const shell = {
  "shell.appShell.sleep": "Sospensione",
  "shell.appShell.cleaning": "Pulizia",
  "shell.appShell.settings": "Impostazioni",
  "shell.status.ready": "Pronto",
  "shell.status.heating": "riscaldamento",
  "shell.status.disconnected": "Disconnesso",
  "shell.status.connecting": "Connessione",
  "shell.status.sourceMachine": "Macchina",
  "shell.fullscreen.recommendedTitle": "Schermo intero consigliato",
  "shell.fullscreen.enter": "Passa a schermo intero",
  "shell.adjust.grindSetting.title": "Grado di macinatura",
  "shell.adjust.dose.title": "Dosaggio",
  "shell.adjust.builderPressure.title": "Pressione",
  "shell.adjust.builderFlow.title": "Flusso",
  "shell.adjust.builderTemperature.title": "Temperatura",
  "shell.adjust.builderDuration.title": "DURATA MASSIMA",
  "shell.adjust.cancel": "Annulla",
  "shell.adjust.save": "Salva",
  "shell.machine.steamTemperatureAria": "Temperatura del vapore",
  "shell.machine.off": "off",
  "shell.machine.offLower": "off",
  "shell.scale.search": "Ricerca",
  "shell.liveOperation.steaming": "Produzione di vapore",
  "shell.cleaning.title": "Pulizia",
  "shell.brewStage.extraction": "Estrazione"
} satisfies Translation<EnglishCatalog>

