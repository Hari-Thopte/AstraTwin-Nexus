import { useEffect, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
import { useMissionExperience } from './MissionExperienceContext'

const PHASE_PROGRESS = {
  prelaunch: 0,
  countdown: 2,
  ignition: 5,
  liftoff: 17,
  orbit: 34,
  travel: 69,
  arrival: 94,
  operations: 100,
} as const

function planetColor(destination: string): number {
  if (destination === 'mars') return 0xd4582a
  if (destination === 'ganymede') return 0x9566cc
  if (destination === 'earth-orbit') return 0x2a7ecf
  if (destination === 'deep-space') return 0x7557d6
  return 0xc9bfa8  // moon/default
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function SpaceJourney() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneState = useRef({ phase: 'prelaunch', progress: 0, destination: 'lunar-south-pole', scroll: 0 })
  const { phase, progress, destination, reducedMotion, lowDetail } = useMissionExperience()
  const [webglAvailable, setWebglAvailable] = useState(true)

  useEffect(() => {
    sceneState.current = { ...sceneState.current, phase, progress, destination: destination.id }
  }, [phase, progress, destination.id])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const testCanvas = document.createElement('canvas')
    if (!testCanvas.getContext('webgl2') && !testCanvas.getContext('webgl')) {
      setWebglAvailable(false)
      return
    }

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x02040b, 0.018)
    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 220)
    camera.position.set(0, 0, 10)
    const renderer = new THREE.WebGLRenderer({ antialias: !lowDetail, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowDetail ? 1 : 1.55))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = !lowDetail
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.setAttribute('aria-hidden', 'true')
    mount.appendChild(renderer.domElement)

    // Lighting — sun casts soft shadows for depth
    const ambient = new THREE.AmbientLight(0x7397c7, 0.9)
    const sun = new THREE.DirectionalLight(0xfff4d6, 4.2)
    sun.position.set(-8, 5, 9)
    if (!lowDetail) {
      sun.castShadow = true
      sun.shadow.mapSize.set(512, 512)
      sun.shadow.camera.near = 0.5
      sun.shadow.camera.far = 60
      sun.shadow.radius = 3
    }
    const violetRim = new THREE.PointLight(0x754bff, 28, 45)
    violetRim.position.set(7, -2, 2)
    const backFill = new THREE.DirectionalLight(0x1a2a5e, 1.1)
    backFill.position.set(6, -3, -8)
    scene.add(ambient, sun, violetRim, backFill)

    // Stars — two layers, vertex-colored
    const isMobile = window.innerWidth < 760
    const starCount = lowDetail || isMobile ? 720 : 2400
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    for (let index = 0; index < starCount; index += 1) {
      const offset = index * 3
      starPositions[offset] = (Math.random() - 0.5) * 80
      starPositions[offset + 1] = (Math.random() - 0.5) * 48
      starPositions[offset + 2] = -Math.random() * 120 + 15
      const tint = 0.72 + Math.random() * 0.28
      starColors[offset] = tint * 0.78
      starColors[offset + 1] = tint * 0.9
      starColors[offset + 2] = tint
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    const starMaterial = new THREE.PointsMaterial({ size: lowDetail ? 0.075 : 0.095, transparent: true, opacity: 0.86, vertexColors: true, sizeAttenuation: true })
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    const farStarGeometry = starGeometry.clone()
    const farStarMaterial = new THREE.PointsMaterial({ size: 0.045, color: 0x778bb8, transparent: true, opacity: 0.55 })
    const farStars = new THREE.Points(farStarGeometry, farStarMaterial)
    farStars.scale.setScalar(1.7)
    farStars.rotation.z = 0.38
    scene.add(farStars)

    // Earth with atmosphere + cloud layer
    const earthGroup = new THREE.Group()
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(3.6, lowDetail ? 28 : 64, lowDetail ? 18 : 40),
      new THREE.MeshStandardMaterial({ color: 0x1a5fa8, roughness: 0.72, metalness: 0.08, emissive: 0x061e40, emissiveIntensity: 0.65 }),
    )
    if (!lowDetail) { earth.castShadow = true; earth.receiveShadow = true }
    earthGroup.add(earth)
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(3.78, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x2ebcff, transparent: true, opacity: 0.13, side: THREE.BackSide }),
    )
    earthGroup.add(atmosphere)
    // Thin cloud layer
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(3.65, lowDetail ? 20 : 48, lowDetail ? 14 : 28),
      new THREE.MeshStandardMaterial({ color: 0xd8ecf8, transparent: true, opacity: 0.18, roughness: 1, metalness: 0, depthWrite: false }),
    )
    earthGroup.add(clouds)
    for (let index = 0; index < 18; index += 1) {
      const land = new THREE.Mesh(
        new THREE.SphereGeometry(0.22 + Math.random() * 0.34, 10, 7),
        new THREE.MeshStandardMaterial({ color: index % 3 ? 0x2e8c60 : 0x5e9672, roughness: 0.9 }),
      )
      const phi = Math.random() * Math.PI * 2
      const theta = (Math.random() - 0.5) * Math.PI
      land.position.set(Math.cos(theta) * Math.cos(phi) * 3.48, Math.sin(theta) * 3.48, Math.cos(theta) * Math.sin(phi) * 3.48)
      land.lookAt(0, 0, 0)
      land.scale.set(1.7, 0.36, 0.2)
      earthGroup.add(land)
    }
    earthGroup.position.set(-4.7, -0.7, -3.8)
    scene.add(earthGroup)

    // Destination planet
    const destinationMaterial = new THREE.MeshStandardMaterial({
      color: planetColor(sceneState.current.destination),
      roughness: 0.88,
      metalness: 0.04,
      emissive: 0x101523,
      emissiveIntensity: 0.2,
    })
    const destinationPlanet = new THREE.Mesh(new THREE.SphereGeometry(2.55, lowDetail ? 30 : 72, lowDetail ? 18 : 44), destinationMaterial)
    destinationPlanet.position.set(7.5, 1, -26)
    if (!lowDetail) { destinationPlanet.castShadow = true; destinationPlanet.receiveShadow = true }
    scene.add(destinationPlanet)

    // Moon craters
    const craterMaterial = new THREE.MeshStandardMaterial({ color: 0x857870, roughness: 1, transparent: true, opacity: 0.55 })
    const craters: THREE.Mesh[] = []
    for (let index = 0; index < 14; index += 1) {
      const crater = new THREE.Mesh(new THREE.CircleGeometry(0.08 + Math.random() * 0.22, 16), craterMaterial)
      const phi = Math.random() * Math.PI * 2
      const theta = (Math.random() - 0.5) * Math.PI * 0.85
      crater.position.set(Math.cos(theta) * Math.cos(phi) * 2.56, Math.sin(theta) * 2.56, Math.cos(theta) * Math.sin(phi) * 2.56)
      crater.lookAt(destinationPlanet.position)
      destinationPlanet.add(crater)
      craters.push(crater)
    }

    // Rocket — 4-fin design, lathe body, inner+outer flame
    const rocket = new THREE.Group()
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, metalness: 0.62, roughness: 0.2 })
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xe8421a, metalness: 0.45, roughness: 0.28 })
    const finMaterial = new THREE.MeshStandardMaterial({ color: 0xe03318, metalness: 0.52, roughness: 0.26 })
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2e42, metalness: 0.82, roughness: 0.2 })

    // Lathe-profile body for smooth 3D silhouette
    const lathePoints = [
      new THREE.Vector2(0.0, -0.75),
      new THREE.Vector2(0.24, -0.65),
      new THREE.Vector2(0.22, -0.3),
      new THREE.Vector2(0.19, 0.3),
      new THREE.Vector2(0.18, 0.75),
    ]
    const rocketBody = new THREE.Mesh(new THREE.LatheGeometry(lathePoints, lowDetail ? 12 : 20), bodyMaterial)

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, lowDetail ? 12 : 20), noseMaterial)
    nose.position.y = 0.99
    const windowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0x4df1ff }))
    windowMesh.position.set(0, 0.38, 0.17)
    windowMesh.scale.set(1, 0.75, 0.25)
    const accentBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.07, lowDetail ? 12 : 20),
      new THREE.MeshStandardMaterial({ color: 0xe03318, metalness: 0.55, roughness: 0.22 }),
    )
    accentBand.position.y = -0.12
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.28, 16), darkMaterial)
    engine.position.y = -0.86

    // 4 fins evenly around the body
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.38), finMaterial)
      fin.position.set(
        Math.cos(i * Math.PI / 2) * 0.26,
        -0.55,
        Math.sin(i * Math.PI / 2) * 0.26,
      )
      fin.rotation.y = i * Math.PI / 2
      fin.rotation.z = (Math.cos(i * Math.PI / 2)) * -0.28
      fin.rotation.x = (Math.sin(i * Math.PI / 2)) * 0.28
      rocket.add(fin)
    }

    // Dual-cone flame: bright inner core + translucent outer
    const flameMaterial = new THREE.MeshBasicMaterial({ color: 0x69f3ff, transparent: true, opacity: 0.82 })
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.2, 15), flameMaterial)
    flame.rotation.x = Math.PI
    flame.position.y = -1.44
    const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 })
    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.65, 12), innerFlameMat)
    innerFlame.rotation.x = Math.PI
    innerFlame.position.y = -1.28

    rocket.add(rocketBody, nose, windowMesh, accentBand, engine, flame, innerFlame)
    rocket.position.set(1.65, -2.2, 1.1)
    rocket.rotation.z = -0.08
    scene.add(rocket)

    // Launch pad
    const launchPad = new THREE.Group()
    const padMaterial = new THREE.MeshStandardMaterial({ color: 0x182638, metalness: 0.72, roughness: 0.34 })
    const padBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.28, 0.22, 20), padMaterial)
    padBase.position.set(1.65, -3.15, 1.1)
    launchPad.add(padBase)
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.25, 0.18), padMaterial)
    tower.position.set(2.55, -2.08, 1.22)
    launchPad.add(tower)
    for (let index = 0; index < 4; index += 1) {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.055, 0.06), padMaterial)
      brace.position.set(2.2, -2.8 + index * 0.52, 1.2)
      brace.rotation.z = index % 2 ? 0.16 : -0.16
      launchPad.add(brace)
      const padLight = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0x44e5ff }))
      padLight.position.set(2.55, -2.82 + index * 0.52, 1.3)
      launchPad.add(padLight)
    }
    scene.add(launchPad)

    // Smoke particles
    const smokeCount = lowDetail ? 28 : 72
    const smokePositions = new Float32Array(smokeCount * 3)
    for (let index = 0; index < smokeCount; index += 1) {
      smokePositions[index * 3] = 1.65 + (Math.random() - 0.5) * 1.4
      smokePositions[index * 3 + 1] = -3.05 + Math.random() * 0.48
      smokePositions[index * 3 + 2] = 1.1 + (Math.random() - 0.5) * 1.2
    }
    const smokeGeometry = new THREE.BufferGeometry()
    smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3))
    const smokeMaterial = new THREE.PointsMaterial({ color: 0x9cc8da, size: 0.22, transparent: true, opacity: 0, depthWrite: false })
    const smoke = new THREE.Points(smokeGeometry, smokeMaterial)
    scene.add(smoke)

    // Rocket flight curve — extra control point for smoother arc
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.65, -2.2, 0.6),
      new THREE.Vector3(1.9, -0.5, -0.5),
      new THREE.Vector3(2.4, 1.2, -2),
      new THREE.Vector3(3.2, 2.2, -7),
      new THREE.Vector3(5.0, 1.8, -13),
      new THREE.Vector3(6.4, 1.3, -18),
    ])
    const route = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(90)),
      new THREE.LineBasicMaterial({ color: 0x35dff4, transparent: true, opacity: 0.28 }),
    )
    scene.add(route)

    // Satellite
    const satellite = new THREE.Group()
    satellite.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.22), darkMaterial))
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x173f84, metalness: 0.35, roughness: 0.5 })
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.035, 0.26), panelMaterial)
      panel.position.x = side * 0.58
      satellite.add(panel)
    }
    satellite.position.set(-0.8, 2.7, -4)
    satellite.scale.setScalar(0.72)
    scene.add(satellite)

    // Smoothed normalized value for lag-free transitions
    let smoothNormalized = 0

    const pointer = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    const onScroll = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLElement) || !target.classList.contains('mission-content')) return
      const available = Math.max(1, target.scrollHeight - target.clientHeight)
      sceneState.current.scroll = Math.min(1, target.scrollTop / available)
    }
    document.addEventListener('scroll', onScroll, true)

    let frame = 0
    const clock = new THREE.Clock()

    const render = () => {
      frame = window.requestAnimationFrame(render)
      const delta = Math.min(clock.getDelta(), 0.05) // cap at 50ms to avoid spiral on tab-switch
      const elapsed = clock.getElapsedTime()
      const current = sceneState.current
      const targetProgress = Math.max(current.progress, PHASE_PROGRESS[current.phase as keyof typeof PHASE_PROGRESS] ?? 0)
      const rawNormalized = targetProgress / 100

      // Smooth normalized so all dependent animations lerp in sync
      const lerpSpeed = reducedMotion ? 1 : delta * 1.4
      smoothNormalized += (rawNormalized - smoothNormalized) * Math.min(1, lerpSpeed)
      const normalized = easeInOut(smoothNormalized)
      const moving = !reducedMotion

      // Planet / earth rotations — delta-time based
      earth.rotation.y += moving ? delta * 0.08 : 0
      clouds.rotation.y += moving ? delta * 0.05 : 0
      clouds.rotation.x += moving ? delta * 0.018 : 0
      destinationPlanet.rotation.y += moving ? delta * 0.055 : 0
      satellite.rotation.y = elapsed * 0.24
      satellite.position.y = 2.7 + Math.sin(elapsed * 0.4) * 0.12

      // Stars
      stars.rotation.z = moving ? elapsed * 0.0015 : 0
      stars.rotation.x = current.scroll * 0.035
      farStars.rotation.z = 0.38 - (moving ? elapsed * 0.0008 : 0)
      stars.position.x += ((pointer.x * -0.28) - stars.position.x) * Math.min(1, delta * 4)
      stars.position.y += ((pointer.y * 0.18) - stars.position.y) * Math.min(1, delta * 4)

      // Star-streaking during travel
      const inLaunch = current.phase === 'countdown' || current.phase === 'ignition' || current.phase === 'liftoff'
      const travelSpeed = current.phase === 'travel' ? 22 : current.phase === 'orbit' ? 8 : 1.2
      if (moving && current.phase !== 'prelaunch') {
        const positions = starGeometry.attributes.position as THREE.BufferAttribute
        for (let index = 2; index < positions.array.length; index += 3) {
          positions.array[index] += delta * travelSpeed
          if (positions.array[index] > 16) positions.array[index] = -105
        }
        positions.needsUpdate = true
      }

      // Rocket — tangent-aligned along curve for true 3D orientation
      const rocketT = Math.min(0.999, normalized * 1.25)
      const rocketPosition = curve.getPoint(rocketT)
      const rocketTarget = curve.getPoint(Math.min(0.999, rocketT + 0.015))
      rocket.position.lerp(rocketPosition, reducedMotion ? 0.35 : Math.min(1, delta * 3.5))
      rocket.scale.setScalar(current.phase === 'operations' ? 0.35 : 0.72 + normalized * 0.12)

      // Align rocket to flight path tangent
      if (current.phase !== 'prelaunch' && current.phase !== 'operations') {
        const tangentDir = new THREE.Vector3().subVectors(rocketTarget, rocketPosition).normalize()
        const up = new THREE.Vector3(0, 1, 0)
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, tangentDir)
        rocket.quaternion.slerp(quaternion, Math.min(1, delta * 2.8))
      } else if (current.phase === 'prelaunch') {
        // Gentle idle sway on pad
        rocket.rotation.z = -0.08 + Math.sin(elapsed * 0.6) * 0.012
        rocket.rotation.x = Math.sin(elapsed * 0.45) * 0.008
      }

      // Flame dynamics
      flame.visible = current.phase !== 'prelaunch' && current.phase !== 'operations'
      innerFlame.visible = flame.visible
      const isThrusting = current.phase === 'ignition' || current.phase === 'liftoff'
      flame.scale.y = isThrusting ? 1.3 + Math.sin(elapsed * 22) * 0.28 : 0.58 + Math.sin(elapsed * 12) * 0.08
      innerFlame.scale.y = isThrusting ? 1.1 + Math.sin(elapsed * 28) * 0.22 : 0.42
      flameMaterial.color.setHex(current.phase === 'ignition' ? 0xff9520 : 0x69f3ff)
      flameMaterial.opacity = 0.72 + Math.sin(elapsed * 14) * 0.12
      innerFlameMat.opacity = 0.6 + Math.sin(elapsed * 18) * 0.18

      // Route / pad / smoke
      route.visible = normalized > 0.12
      launchPad.visible = normalized < 0.53
      launchPad.position.y = -normalized * 5.5
      smoke.visible = normalized < 0.48
      smokeMaterial.opacity = isThrusting ? 0.3 + Math.sin(elapsed * 7) * 0.08 : 0
      smoke.rotation.y = elapsed * 0.08
      smoke.scale.setScalar(1 + normalized * 1.8)

      // Earth recede
      earthGroup.position.x = -4.7 - normalized * 5.8
      earthGroup.position.z = -3.8 - normalized * 15
      earthGroup.scale.setScalar(1 - normalized * 0.64)

      // Destination planet approach — smooth lerp
      destinationMaterial.color.setHex(planetColor(current.destination))
      const destScale = current.phase === 'operations' ? 1.85 : 0.34 + normalized * 0.95
      const destScaleVec = new THREE.Vector3(destScale, destScale, destScale)
      destinationPlanet.scale.lerp(destScaleVec, Math.min(1, delta * 1.8))
      const destTargetX = current.phase === 'operations' ? 5.2 : 7.5 - normalized * 2.2
      const destTargetZ = current.phase === 'operations' ? -6.8 : -26 + normalized * 17
      const destTargetY = 1
      destinationPlanet.position.x += (destTargetX - destinationPlanet.position.x) * Math.min(1, delta * 1.8)
      destinationPlanet.position.z += (destTargetZ - destinationPlanet.position.z) * Math.min(1, delta * 1.8)
      destinationPlanet.position.y += (destTargetY - destinationPlanet.position.y) * Math.min(1, delta * 1.2)

      // Camera: smooth follow with parallax and launch shake
      const shake = inLaunch && current.phase !== 'countdown' && moving ? Math.sin(elapsed * 42) * 0.018 : 0
      // Gradually zoom in as FOV tightens during travel
      const targetFov = 52 - normalized * 6
      camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 1.5)
      camera.updateProjectionMatrix()
      camera.position.x += ((pointer.x * 0.13 + shake) - camera.position.x) * Math.min(1, delta * 2.2)
      camera.position.y += ((pointer.y * -0.08 + shake + current.scroll * 0.34) - camera.position.y) * Math.min(1, delta * 2.2)
      camera.position.z += ((10 - current.scroll * 0.55) - camera.position.z) * Math.min(1, delta * 1.4)
      renderer.render(scene, camera)
    }
    render()

    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('scroll', onScroll, true)
      starGeometry.dispose()
      farStarGeometry.dispose()
      smokeGeometry.dispose()
      starMaterial.dispose()
      farStarMaterial.dispose()
      smokeMaterial.dispose()
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => material.dispose())
        }
        if (object instanceof THREE.Line) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => material.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [lowDetail, reducedMotion])

  return (
    <div className={`space-journey ${webglAvailable ? '' : 'space-fallback'} ${reducedMotion ? 'motion-reduced' : ''}`} aria-hidden="true">
      <div ref={mountRef} className="space-canvas" />
      <div className="nebula nebula-one" />
      <div className="nebula nebula-two" />
      <div className="space-vignette" />
      <div className="technical-horizon" />
      {phase !== 'prelaunch' && phase !== 'countdown' && (
        <div className="destination-label" style={{ '--destination-accent': destination.accent } as CSSProperties}>
          <span>{destination.shortName}</span>
          <strong>{destination.name}</strong>
          <i />
        </div>
      )}
    </div>
  )
}

export function SpaceFallback() {
  return <div className="space-journey space-fallback" aria-hidden="true"><div className="space-vignette" /></div>
}
