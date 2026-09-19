import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const shell = {
  "shell.appShell.sleep": "休眠",
  "shell.appShell.settings": "設定",
  "shell.status.ready": "準備就緒",
  "shell.status.heating": "加熱中",
  "shell.status.disconnected": "已斷線",
  "shell.status.connecting": "連接中",
  "shell.status.sourceMachine": "咖啡機",
  "shell.fullscreen.recommendedTitle": "全螢幕推薦",
  "shell.fullscreen.enter": "進入全螢幕模式",
  "shell.adjust.grindSetting.title": "研磨度",
  "shell.adjust.builderPressure.title": "壓力",
  "shell.adjust.builderFlow.title": "流量",
  "shell.adjust.builderTemperature.title": "溫度",
  "shell.adjust.cancel": "取消",
  "shell.adjust.save": "儲存",
  "shell.machine.steamTemperatureAria": "蒸氣溫度",
  "shell.machine.off": "關",
  "shell.machine.offLower": "關",
  "shell.scale.search": "尋找",
  "shell.liveOperation.steaming": "注入蒸汽中",
  "shell.brewStage.extraction": "萃取"
} satisfies Translation<EnglishCatalog>

