import type { WaterLevels } from '../../api/decaid/types.ts'
import { tankMillilitres } from '../../api/decaid/adapters.ts'
import { finite } from '../../api/decaid/hardwareValidation.ts'
import type { BrewingScreenModel } from '../../domain/brewing.ts'

export function mergeWaterLevels(previous: WaterLevels, frame: WaterLevels): WaterLevels {
  const level = (value: unknown) => finite(value) && value >= 0 ? value : undefined
  return {
    currentLevel: 'currentLevel' in frame ? level(frame.currentLevel) : previous.currentLevel,
    refillLevel: 'refillLevel' in frame ? level(frame.refillLevel) : previous.refillLevel,
  }
}

export function displayWater(model: BrewingScreenModel, levels: WaterLevels, state: string): BrewingScreenModel {
  const volume = levels.currentLevel === undefined ? undefined : tankMillilitres(levels.currentLevel)
  const previous = model.utilities.find(utility => utility.id === 'tank')
  const value = volume === undefined ? '-' : String(volume)
  if (previous && previous.levelPercent === undefined && previous.waterLevelMm === levels.currentLevel && previous.refillLevelMm === levels.refillLevel && previous.alert === (state === 'needsWater') && previous.warning === (state === 'warning') && previous.metrics[0]?.value === value) return model
  return { ...model, utilities: model.utilities.map(utility => utility.id !== 'tank' ? utility : {
    ...utility, levelPercent: undefined, waterLevelMm: levels.currentLevel, refillLevelMm: levels.refillLevel,
    alert: state === 'needsWater', warning: state === 'warning',
    metrics: [{ id: 'volume', value, unit: 'ml' }],
  }) }
}
