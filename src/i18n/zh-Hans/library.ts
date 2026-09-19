import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const library = {
  "library.action.select": "选择",
  "library.action.edit": "编辑",
  "library.action.delete": "删除",
  "library.action.cancel": "取消",
  "library.aria.profilesSection": "档案库",
  "library.column.profile": "配方",
  "library.detail.category": "类别",
  "library.detail.type": "种类",
  "library.detail.version": "版本",
  "library.detail.author": "作者",
  "library.detail.grindSize": "研磨度",
  "library.beverageType.espresso": "特浓咖啡",
  "library.beverageType.pourover": "模拟手冲",
  "library.beverageType.calibrate": "校准",
  "library.beverageType.manual": "手动"
} satisfies Translation<EnglishCatalog>

