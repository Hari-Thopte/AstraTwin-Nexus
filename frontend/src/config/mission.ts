import missionData from './mission.json'

export const MISSION_CONFIG = Object.freeze(missionData)

export const FUTURE_MISSIONS = Object.freeze(missionData.futureMissions)

export const ACTIVE_ASSET_NAMES = Object.freeze([
  MISSION_CONFIG.assets.primary.name,
  MISSION_CONFIG.assets.support.name,
  MISSION_CONFIG.assets.relay.name,
])

export function assertMissionConsistency(values: {
  missionName: string
  destination: string
  assetNames: string[]
}) {
  const conflicts: string[] = []
  if (values.missionName !== MISSION_CONFIG.name) conflicts.push(`Mission name is "${values.missionName}"; expected "${MISSION_CONFIG.name}".`)
  if (values.destination !== MISSION_CONFIG.destination) conflicts.push(`Destination is "${values.destination}"; expected "${MISSION_CONFIG.destination}".`)
  for (const expected of ACTIVE_ASSET_NAMES) {
    if (!values.assetNames.includes(expected)) conflicts.push(`Required asset "${expected}" is missing.`)
  }
  const unknownAssets = values.assetNames.filter(name => !ACTIVE_ASSET_NAMES.includes(name))
  if (unknownAssets.length) conflicts.push(`Unexpected active assets: ${unknownAssets.join(', ')}.`)
  return conflicts
}

export function reportMissionConsistency(values: Parameters<typeof assertMissionConsistency>[0]) {
  if (!import.meta.env.DEV) return
  const conflicts = assertMissionConsistency(values)
  if (conflicts.length) console.error('[AstraTwin mission consistency]', ...conflicts)
}
