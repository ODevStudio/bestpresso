import type { EnglishCatalog } from '../en/index.ts'
import type { Translation } from '../types.ts'

// Selected Streamline CSV translations; see docs/localisation-streamline.md.
export const library = {
  "library.action.select": "選擇",
  "library.action.edit": "編輯",
  "library.action.delete": "刪除",
  "library.action.cancel": "取消",
  "library.aria.profilesSection": "檔案庫",
  "library.column.profile": "配方",
  "library.detail.category": "類別",
  "library.detail.type": "種類",
  "library.detail.version": "版本",
  "library.detail.author": "作者",
  "library.detail.grindSize": "研磨度",
  "library.beverageType.espresso": "特濃咖啡",
  "library.beverageType.pourover": "模擬手沖",
  "library.beverageType.calibrate": "校準",
  "library.beverageType.manual": "手動"
} satisfies Translation<EnglishCatalog>

