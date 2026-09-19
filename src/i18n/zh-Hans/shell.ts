import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const shell = {
  "shell.appShell.sleep": "休眠",
  "shell.appShell.settings": "设定",
  "shell.status.ready": "准备就绪",
  "shell.status.heating": "加热中",
  "shell.status.disconnected": "已断线",
  "shell.status.connecting": "连接中",
  "shell.status.sourceMachine": "咖啡机",
  "shell.fullscreen.recommendedTitle": "全屏推荐",
  "shell.fullscreen.enter": "进入全屏模式",
  "shell.adjust.grindSetting.title": "研磨度",
  "shell.adjust.builderPressure.title": "压力",
  "shell.adjust.builderFlow.title": "流量",
  "shell.adjust.builderTemperature.title": "温度",
  "shell.adjust.cancel": "取消",
  "shell.adjust.save": "储存",
  "shell.machine.steamTemperatureAria": "蒸气温度",
  "shell.machine.off": "关",
  "shell.machine.offLower": "关",
  "shell.scale.search": "寻找",
  "shell.liveOperation.steaming": "注入蒸汽中",
  "shell.brewStage.extraction": "萃取"
} satisfies Translation<EnglishCatalog>

