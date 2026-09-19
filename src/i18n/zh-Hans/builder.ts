import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const builder = {
  "builder.axis.pressure": "压力",
  "builder.axis.flow": "流量",
  "builder.common.max": "最大值",
  "builder.sensor.coffee": "咖啡",
  "builder.sensor.water": "水",
  "builder.stage.waterTemperatureLabel": "水温",
  "builder.stage.transitionLabel": "变换",
  "builder.profile.categoryLabel": "类别",
  "builder.profile.typeLabel": "种类",
  "builder.actions.cancel": "取消",
  "builder.actions.save": "储存",
  "builder.beverageType.espresso": "特浓咖啡",
  "builder.beverageType.pourover": "模拟手冲",
  "builder.beverageType.manual": "手动",
  "builder.beverageType.calibrate": "校准",
  "builder.validation.profileLabel": "配方",
  "builder.details.authorLabel": "作者",
  "builder.details.descriptionLabel": "解说"
} satisfies Translation<EnglishCatalog>

