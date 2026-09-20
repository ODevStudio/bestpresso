import { finite } from '../../api/decaid/hardwareValidation.ts'

export function machineWeightFlow(integrated: boolean, machineFlow: unknown, scaleFlow: unknown) {
  return integrated && finite(machineFlow) ? machineFlow : finite(scaleFlow) ? scaleFlow : undefined
}
