import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const builder = {
  "builder.axis.pressure": "壓力",
  "builder.axis.flow": "流量",
  "builder.common.max": "最大值",
  "builder.sensor.coffee": "咖啡",
  "builder.sensor.water": "水",
  "builder.stage.waterTemperatureLabel": "水溫",
  "builder.stage.transitionLabel": "變換",
  "builder.profile.categoryLabel": "類別",
  "builder.profile.typeLabel": "種類",
  "builder.actions.cancel": "取消",
  "builder.actions.save": "儲存",
  "builder.beverageType.espresso": "特濃咖啡",
  "builder.beverageType.pourover": "模擬手沖",
  "builder.beverageType.manual": "手動",
  "builder.beverageType.calibrate": "校準",
  "builder.validation.profileLabel": "配方",
  "builder.details.authorLabel": "作者",
  "builder.details.descriptionLabel": "解說"
} satisfies Translation<EnglishCatalog>

