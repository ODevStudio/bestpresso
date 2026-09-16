/** Keep cached evidence unchanged; consolidate only its displayed wording. */
export function stageReasonLabels(label = 'Unknown'): string[] {
  const alternatives = label.split(' or ').map(reason => {
    if (reason === 'Manually advanced') return 'Manual advance'
    if (reason === 'Manually stopped') return 'Manual stop'
    return reason
  })
  return alternatives.map((reason, index) =>
    reason.endsWith(' reached') && alternatives[index + 1]?.endsWith(' reached')
      ? reason.slice(0, -' reached'.length)
      : reason,
  )
}
