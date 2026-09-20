import { brewEn } from './brew.ts'
import { builderEn } from './builder.ts'
import { commonEn } from './common.ts'
import { insightsEn } from './insights.ts'
import { libraryEn } from './library.ts'
import { settingsEn } from './settings.ts'
import { shellEn } from './shell.ts'
import { hardwareEn } from './hardware.ts'

/** English source catalog: the released Bestpresso wording, verbatim. Keys are grouped by feature area. */
export const areas = { common: commonEn, shell: shellEn, brew: brewEn, insights: insightsEn, library: libraryEn, builder: builderEn, settings: settingsEn, hardware: hardwareEn } as const

export const en = { ...commonEn, ...shellEn, ...brewEn, ...insightsEn, ...libraryEn, ...builderEn, ...settingsEn, ...hardwareEn } as const

export type EnglishCatalog = typeof en
