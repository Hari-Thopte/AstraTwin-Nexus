import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { MISSION_CONFIG } from '../../config/mission'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useNexusStore } from '../../store/nexusStore'
import { NEXUS_STATUS_COLORS } from '../../utils/nexusData'

interface MeshMeta {
  assetId: 'astra-1' | 'nova' | 'selene'
  componentId: string
  baseColor: string
}

function standard(color: string, metalness = 0.55, roughness = 0.34) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness })
}

function taggedMesh(geometry: THREE.BufferGeometry, material: THREE.Material, meta: Omit<MeshMeta, 'baseColor'>, baseColor: string) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData = { ...meta, baseColor }
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function TwinScene() {
  const hostRef = useRef<HTMLDivElement>(null)
  const componentMeshes = useRef<Map<string, THREE.Mesh[]>>(new Map())
  const routeRef = useRef<THREE.Line | null>(null)
  const earthLinkRef = useRef<THREE.Line | null>(null)
  const rotorsRef = useRef<THREE.Group[]>([])
  const assets = useNexusStore(state => state.assets)
  const stage = useNexusStore(state => state.rewindIndex)
  const selectedAssetId = useNexusStore(state => state.selectedAssetId)
  const selectedComponentId = useNexusStore(state => state.selectedComponentId)
  const selectAsset = useNexusStore(state => state.selectAsset)
  const selectComponent = useNexusStore(state => state.selectComponent)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#050914')
    scene.fog = new THREE.FogExp2('#050914', 0.035)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(8.8, 6.5, 11.5)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // Canvas must fill its container — style.width/height separate from pixel dimensions
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.enablePan = false
    controls.minDistance = 6
    controls.maxDistance = 24
    controls.target.set(0, 0.8, 0)

    scene.add(new THREE.HemisphereLight('#8be8ff', '#080a12', 1.25))
    const key = new THREE.DirectionalLight('#e8f8ff', 2.4)
    key.position.set(5, 10, 7)
    key.castShadow = true
    scene.add(key)
    const rim = new THREE.PointLight('#7c3aed', 26, 18)
    rim.position.set(-5, 4, -3)
    scene.add(rim)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(12, 64),
      new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.96, metalness: 0.06 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const grid = new THREE.GridHelper(20, 30, '#17445a', '#102333')
    grid.position.y = 0.012
    ;(grid.material as THREE.Material).opacity = 0.24
    ;(grid.material as THREE.Material).transparent = true
    scene.add(grid)

    const starsGeometry = new THREE.BufferGeometry()
    const starPositions = new Float32Array(360)
    for (let index = 0; index < starPositions.length; index += 3) {
      starPositions[index] = (Math.random() - 0.5) * 32
      starPositions[index + 1] = 4 + Math.random() * 12
      starPositions[index + 2] = (Math.random() - 0.5) * 28
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: '#a5e9ff', size: 0.035, transparent: true, opacity: 0.75 })))

    const register = (mesh: THREE.Mesh, meta: MeshMeta) => {
      const keyName = `${meta.assetId}:${meta.componentId}`
      componentMeshes.current.set(keyName, [...(componentMeshes.current.get(keyName) ?? []), mesh])
    }

    // ── Astra-1 Rover ────────────────────────────────────────────────────────
    const rover = new THREE.Group()
    rover.position.set(-4.1, 0.22, 0.8)
    // Body — steel-blue chassis
    const body = taggedMesh(new THREE.BoxGeometry(2.4, 0.62, 1.45), standard('#2d5278', 0.62, 0.3), { assetId: 'astra-1', componentId: 'drive-motor' }, '#2d5278')
    body.position.y = 0.75; rover.add(body); register(body, body.userData as MeshMeta)
    // Battery pack — amber-gold
    const battery = taggedMesh(new THREE.BoxGeometry(0.9, 0.35, 0.8), standard('#d97706', 0.4, 0.3), { assetId: 'astra-1', componentId: 'primary-battery' }, '#d97706')
    battery.position.set(0.2, 1.2, 0); rover.add(battery); register(battery, battery.userData as MeshMeta)
    // Antenna mast — slate grey
    const mast = taggedMesh(new THREE.CylinderGeometry(0.07, 0.09, 1.35, 10), standard('#94a3b8', 0.5, 0.5), { assetId: 'astra-1', componentId: 'high-gain-antenna' }, '#94a3b8')
    mast.position.set(-0.65, 1.58, 0); rover.add(mast); register(mast, mast.userData as MeshMeta)
    // Antenna dish — bright white/silver
    const antenna = taggedMesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 24), standard('#dde8f4', 0.55, 0.2), { assetId: 'astra-1', componentId: 'high-gain-antenna' }, '#dde8f4')
    antenna.rotation.x = Math.PI / 2.7; antenna.position.set(-0.65, 2.22, 0); rover.add(antenna); register(antenna, antenna.userData as MeshMeta)
    for (const side of [-1, 1]) {
      // Solar panels — deep cobalt blue
      const panel = taggedMesh(new THREE.BoxGeometry(1.35, 0.07, 0.75), standard('#1d4ed8', 0.25, 0.18), { assetId: 'astra-1', componentId: 'solar-array' }, '#1d4ed8')
      panel.position.set(side * 1.8, 1.04, 0); rover.add(panel); register(panel, panel.userData as MeshMeta)
      for (const z of [-0.56, 0.56]) {
        const componentId = side === -1 && z === 0.56 ? 'left-wheel' : 'drive-motor'
        // Wheels — dark rubber grey
        const wheel = taggedMesh(new THREE.CylinderGeometry(0.48, 0.48, 0.38, 18), standard('#374151', 0.08, 0.78), { assetId: 'astra-1', componentId }, '#374151')
        wheel.rotation.x = Math.PI / 2
        wheel.position.set(side * 1.02, 0.46, z)
        rover.add(wheel); register(wheel, wheel.userData as MeshMeta)
      }
    }
    scene.add(rover)

    // ── Nova Scout Drone ─────────────────────────────────────────────────────
    const drone = new THREE.Group()
    drone.position.set(0, 2.35, -0.6)
    // Core body — violet/purple
    const core = taggedMesh(new THREE.OctahedronGeometry(0.64, 1), standard('#6d28d9', 0.55, 0.3), { assetId: 'nova', componentId: 'flight-system' }, '#6d28d9')
    drone.add(core); register(core, core.userData as MeshMeta)
    // Camera lens — cyan
    const cameraMesh = taggedMesh(new THREE.SphereGeometry(0.24, 16, 12), standard('#06b6d4', 0.15, 0.12), { assetId: 'nova', componentId: 'terrain-camera' }, '#06b6d4')
    cameraMesh.position.set(0, -0.52, 0.25); drone.add(cameraMesh); register(cameraMesh, cameraMesh.userData as MeshMeta)
    // Battery — emerald green
    const droneBattery = taggedMesh(new THREE.BoxGeometry(0.58, 0.22, 0.42), standard('#059669', 0.38, 0.3), { assetId: 'nova', componentId: 'nova-battery' }, '#059669')
    droneBattery.position.y = 0.4; drone.add(droneBattery); register(droneBattery, droneBattery.userData as MeshMeta)
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      // Arms — warm grey
      const arm = taggedMesh(new THREE.CylinderGeometry(0.05, 0.06, 1.35, 8), standard('#6b7280', 0.5, 0.45), { assetId: 'nova', componentId: 'flight-system' }, '#6b7280')
      arm.rotation.z = Math.PI / 2
      arm.rotation.y = x * z * 0.78
      arm.position.set(x * 0.56, 0, z * 0.56)
      drone.add(arm); register(arm, arm.userData as MeshMeta)
      const rotor = new THREE.Group()
      rotor.position.set(x * 1.12, 0.08, z * 1.12)
      // Rotor hubs — lavender
      const hub = taggedMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 12), standard('#a78bfa', 0.5, 0.25), { assetId: 'nova', componentId: 'flight-system' }, '#a78bfa')
      // Blades — sky blue, semi-transparent feel
      const blade = taggedMesh(new THREE.BoxGeometry(1.05, 0.025, 0.09), standard('#bae6fd', 0.08, 0.18), { assetId: 'nova', componentId: 'flight-system' }, '#bae6fd')
      rotor.add(hub, blade); drone.add(rotor); rotorsRef.current.push(rotor); register(hub, hub.userData as MeshMeta); register(blade, blade.userData as MeshMeta)
    }
    scene.add(drone)

    // ── Selene Lunar Base ─────────────────────────────────────────────────────
    const base = new THREE.Group()
    base.position.set(4.2, 0, 0.75)
    // Habitat module — warm sand/khaki
    const habitat = taggedMesh(new THREE.CylinderGeometry(1.15, 1.35, 1.55, 10), standard('#b45309', 0.4, 0.55), { assetId: 'selene', componentId: 'base-power' }, '#b45309')
    habitat.position.y = 0.78; base.add(habitat); register(habitat, habitat.userData as MeshMeta)
    // Relay mast — steel
    const relayMast = taggedMesh(new THREE.CylinderGeometry(0.09, 0.13, 2.5, 10), standard('#9ca3af', 0.6, 0.4), { assetId: 'selene', componentId: 'relay-array' }, '#9ca3af')
    relayMast.position.set(0.15, 2.5, 0); base.add(relayMast); register(relayMast, relayMast.userData as MeshMeta)
    // Dish — bright white
    const dish = taggedMesh(new THREE.SphereGeometry(0.66, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.3), standard('#e8f0fa', 0.45, 0.2), { assetId: 'selene', componentId: 'relay-array' }, '#e8f0fa')
    dish.scale.y = 0.3; dish.rotation.z = -0.55; dish.position.set(0.48, 3.6, 0); base.add(dish); register(dish, dish.userData as MeshMeta)
    // Data vault — bright purple
    const vault = taggedMesh(new THREE.BoxGeometry(0.72, 0.55, 0.85), standard('#7c3aed', 0.5, 0.3), { assetId: 'selene', componentId: 'data-vault' }, '#7c3aed')
    vault.position.set(-0.62, 0.55, 1.05); base.add(vault); register(vault, vault.userData as MeshMeta)
    scene.add(base)

    const makeLine = (positions: number[], color: string, dashed = false) => {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      const material = dashed
        ? new THREE.LineDashedMaterial({ color, transparent: true, opacity: 0.66, dashSize: 0.24, gapSize: 0.15 })
        : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.78 })
      const line = new THREE.Line(geometry, material)
      if (dashed) line.computeLineDistances()
      scene.add(line)
      return line
    }
    makeLine([-4.1, 2.1, 0.8, 0, 2.4, -0.6, 4.2, 3.2, 0.75], '#8b5cf6', true)
    earthLinkRef.current = makeLine([4.2, 3.2, 0.75, 7.4, 7.5, -4], '#21d99a', true)
    routeRef.current = makeLine([-4.1, 0.08, 0.8, -2.7, 0.08, -1.4, -0.8, 0.08, -2.9, 1.4, 0.08, -3.2, 3.2, 0.08, -2.1, 5.1, 0.08, -1.1], '#22d3ee')
    routeRef.current.visible = false

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointer = (event: PointerEvent, activate: boolean) => {
      const bounds = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(scene.children, true).find(item => item.object.userData.assetId)
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab'
      if (hit && activate) {
        const meta = hit.object.userData as MeshMeta
        selectAsset(meta.assetId)
        selectComponent(meta.componentId)
      }
    }
    const move = (event: PointerEvent) => onPointer(event, false)
    const click = (event: PointerEvent) => onPointer(event, true)
    renderer.domElement.addEventListener('pointermove', move)
    renderer.domElement.addEventListener('pointerdown', click)

    const resize = () => {
      const width = host.offsetWidth || 800
      const height = Math.max(420, host.offsetHeight)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      // updateStyle:false — let CSS handle display size, only update pixel buffer
      renderer.setSize(width, height, false)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    // Kick off immediately (layout already complete at this point in the effect)
    resize()
    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      rotorsRef.current.forEach((rotor, index) => { rotor.rotation.y += 0.12 + index * 0.005 })
      drone.position.y = 2.35 + Math.sin(performance.now() * 0.0018) * 0.08
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointermove', move)
      renderer.domElement.removeEventListener('pointerdown', click)
      controls.dispose()
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => material.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
      componentMeshes.current.clear()
      rotorsRef.current = []
    }
  }, [selectAsset, selectComponent])

  useEffect(() => {
    componentMeshes.current.forEach((meshes, key) => {
      const [assetId, componentId] = key.split(':')
      const component = assets.find(asset => asset.id === assetId)?.components.find(item => item.id === componentId)
      const rewindAffected = stage >= 6 && assetId === 'astra-1' && ['left-wheel', 'drive-motor', 'primary-battery'].includes(componentId)
      const statusColor = rewindAffected ? NEXUS_STATUS_COLORS[componentId === 'primary-battery' ? 'warning' : 'high'] : component ? NEXUS_STATUS_COLORS[component.status] : '#64748b'
      const isNormal = !rewindAffected && component?.status === 'normal'
      const selected = selectedAssetId === assetId && selectedComponentId === componentId
      meshes.forEach(mesh => {
        const material = mesh.material as THREE.MeshStandardMaterial
        const baseColor = (mesh.userData as MeshMeta).baseColor
        // Keep the designed base color; only override it on selection or fault
        material.color.set(selected ? '#e9fbff' : isNormal ? baseColor : statusColor)
        material.emissive.set(selected ? '#e9fbff' : statusColor)
        material.emissiveIntensity = selected ? 0.55 : isNormal ? 0.04 : 0.38
      })
    })
    if (routeRef.current) routeRef.current.visible = stage >= 5
    if (earthLinkRef.current) {
      const material = earthLinkRef.current.material as THREE.LineDashedMaterial
      material.color.set(stage >= 7 ? '#ff405f' : '#21d99a')
      material.opacity = stage >= 7 ? 0.22 : 0.7
    }
  }, [assets, selectedAssetId, selectedComponentId, stage])

  return <div ref={hostRef} className="h-full min-h-[420px] w-full overflow-hidden rounded-xl" aria-label={`Interactive Three.js digital twins of ${MISSION_CONFIG.assets.primary.name}, ${MISSION_CONFIG.assets.support.name} and ${MISSION_CONFIG.assets.relay.name}`} />
}
