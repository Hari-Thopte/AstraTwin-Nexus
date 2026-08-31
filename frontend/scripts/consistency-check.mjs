import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDirectory, '..')
const src = path.join(root, 'src')
const mission = JSON.parse(fs.readFileSync(path.join(src, 'config', 'mission.json'), 'utf8'))
const failures = []

function check(condition, message) {
  if (!condition) failures.push(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

check(mission.name === 'Lunar South Pole Expedition', 'Shared mission name is inconsistent.')
check(mission.destination === 'Moon', 'Active destination must be Moon.')
check(mission.operatingRegion === 'Lunar South Pole', 'Operating region must be Lunar South Pole.')
check(mission.environment === 'Lunar surface', 'Environment must be Lunar surface.')
check(mission.activePhase === 'Surface Operations', 'Default phase must be Surface Operations.')
check(mission.incident.name === 'Lunar Nightfall Rescue', 'Incident name is inconsistent.')
check(mission.futureMissions.every(item => item.status === 'Unavailable'), 'Future missions must be unavailable.')
check(JSON.stringify(mission.assets).includes('Astra-1') && JSON.stringify(mission.assets).includes('Nova') && JSON.stringify(mission.assets).includes('Selene'), 'Required asset names are missing.')

const activeFiles = [
  'src/App.tsx',
  'src/components/layout/AppShell.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/TopBar.tsx',
  'src/components/experience/LaunchExperience.tsx',
  'src/components/experience/MissionExperienceContext.tsx',
  'src/components/experience/MissionCorridorMap.tsx',
  'src/components/experience/SpaceJourney.tsx',
  'src/components/experience/SpaceMissionMap.tsx',
  'src/components/nexus/LunarMap.tsx',
  'src/components/nexus/NexusUI.tsx',
  'src/pages/MissionControlPage.tsx',
  'src/pages/DigitalTwinPage.tsx',
  'src/pages/TelemetryPage.tsx',
  'src/pages/IncidentIntelligencePage.tsx',
  'src/pages/MissionCouncilPage.tsx',
  'src/pages/FutureSimulatorPage.tsx',
  'src/pages/ScienceDiscoveryPage.tsx',
  'src/pages/MissionMemoryPage.tsx',
  'src/pages/ReportsAuditPage.tsx',
]

// These modules deliberately contain future-destination profiles or rendering
// data while the active mission remains fixed by mission.json.
const futureDestinationAwareFiles = new Set([
  'src/components/experience/LaunchExperience.tsx',
  'src/components/experience/MissionExperienceContext.tsx',
  'src/components/experience/MissionCorridorMap.tsx',
  'src/components/experience/SpaceJourney.tsx',
  'src/pages/MissionCouncilPage.tsx',
])

for (const file of activeFiles) {
  const source = read(file)
  if (!futureDestinationAwareFiles.has(file)) {
    check(!/\b(?:Mars|Martian)\b/i.test(source), `${file} contains an active Mars reference.`)
  }
}

const interactiveFiles = walk(src).filter(file => /\.(tsx|jsx)$/.test(file))
for (const fullPath of interactiveFiles) {
  const source = fs.readFileSync(fullPath, 'utf8')
  const relativePath = path.relative(root, fullPath).replaceAll('\\', '/')
  const buttonTags = source.matchAll(/<button\b([^>]*)>/gs)
  for (const match of buttonTags) {
    check(/onClick\s*=/.test(match[1]), `${relativePath} contains a button without an onClick handler: ${match[0].slice(0, 90)}`)
  }
}

const allSource = walk(src).filter(file => /\.(ts|tsx)$/.test(file)).map(file => fs.readFileSync(file, 'utf8')).join('\n')
check(!allSource.includes('SafetyNotice'), 'Repeated generic SafetyNotice component or usage remains.')
check((allSource.match(/export function MissionInformationPanel/g) ?? []).length === 1 && (allSource.match(/<MissionInformationPanel\s*\/>/g) ?? []).length === 1, 'MissionInformationPanel must have one definition and one page usage.')
check(read('src/pages/TelemetryPage.tsx').includes('Generated telemetry uses a seeded simulation. It is not live spacecraft data.'), 'Telemetry simulation disclosure is missing.')
check(read('src/pages/TelemetryPage.tsx').includes('SourceLabel'), 'Telemetry source labels are missing.')
check(read('src/pages/IncidentIntelligencePage.tsx').includes('Incident Relationship Graph'), 'Incident graph title is inconsistent.')
check(read('src/pages/ReportsAuditPage.tsx').includes('System Methods'), 'System Methods panel is missing.')
check(read('src/index.css').includes('@media (max-width: 380px)') && read('src/index.css').includes('.council-metric-row'), 'Council narrow-screen spacing rules are missing.')

const methodsSource = read('src/config/methods.ts')
for (const field of ['method:', 'inputs:', 'output:', 'status:', 'origin:', 'source:', 'limitation:']) {
  check(methodsSource.includes(field), `Method metadata field ${field} is missing.`)
}
check(!/status:\s*'\[NEEDS METHOD\]'[\s\S]{0,160}origin:\s*'Calculated'/.test(methodsSource), 'A [NEEDS METHOD] capability is incorrectly labelled Calculated.')

const backendLoader = path.resolve(root, '..', 'backend', 'app', 'mission_config.py')
check(fs.existsSync(backendLoader) && fs.readFileSync(backendLoader, 'utf8').includes('frontend" / "src" / "config" / "mission.json'), 'Backend does not load the shared mission configuration.')

if (failures.length) {
  console.error(`Consistency check failed (${failures.length}):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Consistency check passed for ${activeFiles.length} active UI files and ${interactiveFiles.length} interactive source files.`)
