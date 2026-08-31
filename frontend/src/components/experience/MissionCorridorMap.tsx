import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { AlertTriangle, Crosshair, Globe2, Hand, Moon, Radio, Rocket } from 'lucide-react'
import { useMissionExperience } from './MissionExperienceContext'
import { MISSION_CONFIG } from '../../config/mission'

type MapTarget = 'earth' | 'moon' | 'destination' | 'explorer'

const DESTINATION_COLORS: Record<string, number> = {
  'lunar-south-pole': 0xc9bfa8,
  'earth-orbit': 0x2a7ecf,
  mars: 0xd4582a,
  ganymede: 0x9566cc,
}

const TARGET_LABELS: Record<MapTarget, string> = {
  earth: 'Earth',
  moon: 'Moon',
  destination: 'Destination',
  explorer: 'Nexus Explorer',
}

function createPlanet(radius: number, color: number, emissive: number) {
  const group = new THREE.Group()
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.04, emissive, emissiveIntensity: 0.22 }),
  )
  group.add(planet)
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.06, 32, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.BackSide }),
  ))
  return { group, planet }
}

export function MissionCorridorMap() {
  const mountRef = useRef<HTMLDivElement>(null)
  const { destination, reducedMotion, lowDetail } = useMissionExperience()
  const [selected, setSelected] = useState<MapTarget>(destination.id === 'lunar-south-pole' ? 'moon' : 'destination')
  const hasSeparateDestination = destination.id !== 'lunar-south-pole'

  const targetDetails = useMemo(() => ({
    earth: {
      name: 'Earth', distance: 'Origin', delay: 'Local',
      conditions: 'Home world · mission control · primary communications uplink',
      objective: 'Maintain the verified command and telemetry link.', risks: ['Atmospheric departure', 'Orbital traffic'],
      status: 'Link nominal', statusTone: 'nominal',
      impact: 'No active route constraint. Earth remains the command and telemetry authority.',
      requiredAction: 'Maintain the verified uplink and local relay.',
    },
    moon: {
      name: destination.id === 'lunar-south-pole' ? destination.name : 'Moon', distance: '384,400 km', delay: '1.28 seconds',
      conditions: destination.id === 'lunar-south-pole' ? destination.conditions : 'Airless surface · low gravity · extreme thermal cycle',
      objective: destination.id === 'lunar-south-pole' ? destination.objective : 'Lunar relay and navigation reference.',
      risks: destination.id === 'lunar-south-pole' ? destination.risks : ['Micrometeoroids', 'Earth-link occlusion'],
      status: destination.id === 'lunar-south-pole' ? 'Verification pending' : 'Relay nominal',
      statusTone: destination.id === 'lunar-south-pole' ? 'warning' : 'nominal',
      impact: destination.id === 'lunar-south-pole' ? 'Two terrain cells on the proposed route still require confirmation.' : 'The lunar relay introduces no active route constraint.',
      requiredAction: destination.id === 'lunar-south-pole' ? `Hold approval until ${MISSION_CONFIG.assets.support.name} completes the terrain scan.` : 'Maintain relay tracking.',
    },
    destination: {
      name: destination.name, distance: destination.id === 'mars' ? '225 million km' : destination.id === 'ganymede' ? '628 million km' : destination.id === 'earth-orbit' ? '408 km' : '384,400 km',
      delay: destination.delay, conditions: destination.conditions, objective: destination.objective, risks: destination.risks,
      status: 'Destination tracked', statusTone: 'nominal',
      impact: 'Destination conditions define the current transfer corridor and communications delay.',
      requiredAction: 'Continue corridor monitoring before committing the next burn.',
    },
    explorer: {
      name: destination.spacecraft, distance: 'In transit', delay: destination.delay,
      conditions: `Autonomous corridor navigation · ${destination.travelLabel}`,
      objective: 'Carry the mission package along the reviewed transfer corridor.', risks: ['Navigation drift', 'Communications interruption'],
      status: 'Route hold', statusTone: 'warning',
      impact: 'The transfer remains inside the reviewed corridor, but the next irreversible action is locked.',
      requiredAction: 'Preserve position and await the human route decision.',
    },
  }), [destination])

  useEffect(() => {
    setSelected(destination.id === 'lunar-south-pole' ? 'moon' : 'destination')
  }, [destination.id])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x030713, 0.025)
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100)
    camera.position.set(0, 0.15, 9.6)

    const renderer = new THREE.WebGLRenderer({ antialias: !lowDetail, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowDetail ? 1 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.className = 'space-map-canvas'
    renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional mission corridor')
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.enablePan = false
    controls.minDistance = 6.5
    controls.maxDistance = 15
    controls.minPolarAngle = Math.PI * 0.3
    controls.maxPolarAngle = Math.PI * 0.7
    controls.target.set(0, 0.1, -1.2)

    scene.add(new THREE.AmbientLight(0x7898cc, 1.25))
    const sun = new THREE.DirectionalLight(0xffe8bd, 4.4)
    sun.position.set(-6, 5, 7)
    scene.add(sun)
    const rim = new THREE.PointLight(0x2f8fff, 18, 25)
    rim.position.set(5, -2, 3)
    scene.add(rim)

    const starCount = lowDetail ? 260 : 560
    const starPositions = new Float32Array(starCount * 3)
    for (let index = 0; index < starCount; index += 1) {
      const offset = index * 3
      starPositions[offset] = (Math.random() - 0.5) * 34
      starPositions[offset + 1] = (Math.random() - 0.5) * 20
      starPositions[offset + 2] = -Math.random() * 28 + 4
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMaterial = new THREE.PointsMaterial({ color: 0xb9ddff, size: 0.045, transparent: true, opacity: 0.78 })
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    const earthResult = createPlanet(1.42, 0x2d78bd, 0x08295f)
    earthResult.group.position.set(3.15, -1.05, -1.35)
    earthResult.group.userData.target = 'earth'
    earthResult.planet.userData.target = 'earth'
    scene.add(earthResult.group)

    const moonResult = createPlanet(0.78, 0xc9c2ad, 0x35342e)
    moonResult.group.position.set(-1.55, -0.65, -0.2)
    moonResult.group.userData.target = 'moon'
    moonResult.planet.userData.target = 'moon'
    scene.add(moonResult.group)

    let destinationPlanet: THREE.Mesh | null = null
    const destinationPosition = new THREE.Vector3(-3.25, -0.25, -2.8)
    if (hasSeparateDestination) {
      const destinationResult = createPlanet(1.05, DESTINATION_COLORS[destination.id], DESTINATION_COLORS[destination.id])
      destinationResult.group.position.copy(destinationPosition)
      destinationResult.group.userData.target = 'destination'
      destinationResult.planet.userData.target = 'destination'
      destinationPlanet = destinationResult.planet
      scene.add(destinationResult.group)
    } else {
      destinationPosition.copy(moonResult.group.position)
      const landingTarget = new THREE.Mesh(
        new THREE.TorusGeometry(0.82, 0.018, 8, 64),
        new THREE.MeshBasicMaterial({ color: 0x6ee7f9, transparent: true, opacity: 0.7 }),
      )
      landingTarget.position.copy(moonResult.group.position)
      landingTarget.rotation.x = Math.PI / 2.4
      scene.add(landingTarget)
    }

    const route = new THREE.CatmullRomCurve3([
      earthResult.group.position.clone().add(new THREE.Vector3(-0.8, 0.15, 0)),
      new THREE.Vector3(1.8, 0.35, -0.25),
      new THREE.Vector3(0.1, 1.35, -0.8),
      destinationPosition.clone().add(new THREE.Vector3(0.75, 0.25, 0)),
    ])
    const routeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(route.getPoints(90)),
      new THREE.LineBasicMaterial({ color: 0x4ddfed, transparent: true, opacity: 0.68 }),
    )
    scene.add(routeLine)

    const returnRoute = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3([
        destinationPosition.clone(), new THREE.Vector3(-0.5, 0.2, -2), earthResult.group.position.clone(),
      ]).getPoints(70)),
      new THREE.LineDashedMaterial({ color: 0x56c9b2, transparent: true, opacity: 0.34, dashSize: 0.14, gapSize: 0.1 }),
    )
    returnRoute.computeLineDistances()
    scene.add(returnRoute)

    const explorer = new THREE.Group()
    explorer.userData.target = 'explorer'
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.46, 14), new THREE.MeshStandardMaterial({ color: 0xe7edf2, metalness: 0.65, roughness: 0.22 }))
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.18, 14), new THREE.MeshStandardMaterial({ color: 0xe64825, metalness: 0.4, roughness: 0.25 }))
    nose.position.y = 0.31
    const solarMaterial = new THREE.MeshStandardMaterial({ color: 0x144f82, emissive: 0x06284b, emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.3 })
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.018, 0.18), solarMaterial)
    panel.position.y = -0.02
    const engineGlow = new THREE.PointLight(0x38bdf8, 2.4, 1.8)
    engineGlow.position.y = -0.38
    const engineFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.22, 10),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.82 }),
    )
    engineFlame.position.y = -0.38
    engineFlame.rotation.z = Math.PI
    explorer.add(body, nose, panel, engineGlow, engineFlame)
    explorer.scale.setScalar(1.8)
    scene.add(explorer)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let pointerDown = { x: 0, y: 0 }
    const onPointerDown = (event: PointerEvent) => { pointerDown = { x: event.clientX, y: event.clientY } }
    const onPointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(scene.children, true).find(item => item.object.userData.target || item.object.parent?.userData.target)
      const target = hit && (hit.object.userData.target || hit.object.parent?.userData.target)
      if (target) setSelected(target as MapTarget)
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    let frame = 0
    let elapsed = 0
    let explorerProgress = 0.14
    let explorerDirection = 1
    let isVisible = true
    const clock = new THREE.Clock()
    const animate = () => {
      frame = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.05)
      if (!isVisible) return
      elapsed += delta
      earthResult.planet.rotation.y += delta * 0.06
      moonResult.planet.rotation.y += delta * 0.035
      if (destinationPlanet) destinationPlanet.rotation.y += delta * 0.045
      if (!reducedMotion) {
        explorerProgress += delta * 0.07 * explorerDirection
        if (explorerProgress >= 0.9) {
          explorerProgress = 0.9
          explorerDirection = -1
        } else if (explorerProgress <= 0.14) {
          explorerProgress = 0.14
          explorerDirection = 1
        }
        const lookAheadProgress = THREE.MathUtils.clamp(explorerProgress + 0.025 * explorerDirection, 0, 1)
        const position = route.getPoint(explorerProgress)
        const ahead = route.getPoint(lookAheadProgress)
        explorer.position.copy(position)
        explorer.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), ahead.clone().sub(position).normalize()), 0.08)
        engineFlame.scale.y = 0.84 + Math.sin(elapsed * 18) * 0.16
        renderer.domElement.dataset.spacecraftProgress = explorerProgress.toFixed(3)
        renderer.domElement.dataset.spacecraftDirection = explorerDirection > 0 ? 'outbound' : 'returning'
        stars.rotation.z += delta * 0.0015
      } else {
        explorer.position.copy(route.getPoint(0.54))
        renderer.domElement.dataset.spacecraftProgress = '0.540'
        renderer.domElement.dataset.spacecraftDirection = 'paused-reduced-motion'
      }
      controls.update()
      renderer.render(scene, camera)
    }

    const resize = () => {
      const width = mount.clientWidth || 680
      const height = mount.clientHeight || 420
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    const visibilityObserver = new IntersectionObserver(entries => {
      isVisible = entries[0]?.isIntersecting ?? true
      if (isVisible) clock.getDelta()
    }, { rootMargin: '160px' })
    visibilityObserver.observe(mount)
    resize()
    animate()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibilityObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => material.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [destination, hasSeparateDestination, lowDetail, reducedMotion])

  const details = targetDetails[selected]
  const targets: MapTarget[] = hasSeparateDestination ? ['earth', 'moon', 'destination', 'explorer'] : ['earth', 'moon', 'explorer']

  return (
    <div className="space-map-shell council-corridor-map">
      <div className="corridor-map-viewport">
        <div ref={mountRef} className="absolute inset-0" />
        <div className="space-map-grid" aria-hidden="true" />
        <div className="map-targets" aria-label="Mission corridor objects">
        {targets.map(target => (
          <button key={target} type="button" className={selected === target ? 'active' : ''} onClick={() => setSelected(target)}>
            {target === 'earth' ? <Globe2 size={11} /> : target === 'moon' ? <Moon size={11} /> : target === 'explorer' ? <Rocket size={11} /> : <Crosshair size={11} />}
            {target === 'destination' ? destination.shortName : TARGET_LABELS[target]}
          </button>
        ))}
      </div>
      <div className="map-progress"><span>ROUTE PROGRESS</span><strong>76%</strong><i><b /></i></div>
      <div className="map-instructions"><Hand size={10} /> Drag to orbit · scroll to zoom</div>
      <div className="map-link-status"><Radio size={11} /><span>EARTH LINK</span><strong>STABLE · STATIC</strong></div>
      </div>
      <div className="map-object-card corridor-object-dock" aria-live="polite">
        <div className="corridor-object-identity">
          <div className="map-object-eyebrow"><Crosshair size={11} /> SELECTED OBJECT <span className={`corridor-object-status ${details.statusTone}`}>{details.status}</span></div>
          <h3>{details.name}</h3>
          <div className="map-object-stats"><span>DISTANCE<strong>{details.distance}</strong></span><span>COMM DELAY<strong>{details.delay}</strong></span></div>
        </div>
        <div className="corridor-object-summary">
          <span>Mission impact</span>
          <p>{details.impact}</p>
          <div className="map-object-objective"><Crosshair size={11} />{details.requiredAction}</div>
        </div>
        <div className="corridor-object-context">
          <span>Environment</span>
          <p>{details.conditions}</p>
          <div className="map-risk-list"><AlertTriangle size={11} />{details.risks.join(' · ')}</div>
        </div>
      </div>
    </div>
  )
}
