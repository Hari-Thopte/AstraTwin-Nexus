import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  destinationColor?: number   // hex number for destination planet
  destinationLabel?: string
  accentColor?: string        // CSS colour for labels
}

// Destination planet colour map
const DEST_COLORS: Record<string, number> = {
  'lunar-south-pole': 0xc9bfa8,
  'earth-orbit':      0x2a7ecf,
  mars:               0xd4582a,
  ganymede:           0x9566cc,
  default:            0xc9bfa8,
}

export function LaunchMiniSim({ destinationColor, destinationLabel = 'DESTINATION', accentColor = '#22d3ee' }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Scene setup ──────────────────────────────────────────────────────────
    const W = mount.offsetWidth || 340
    const H = mount.offsetHeight || 220
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020810, 0.028)

    const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 120)
    camera.position.set(0, 0, 10)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(W, H, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    mount.appendChild(renderer.domElement)

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x6888cc, 1.1))
    const sun = new THREE.DirectionalLight(0xfff2cc, 3.8)
    sun.position.set(-5, 6, 8)
    scene.add(sun)
    const rim = new THREE.PointLight(0x5533aa, 18, 30)
    rim.position.set(5, -2, 2)
    scene.add(rim)

    // ── Stars ─────────────────────────────────────────────────────────────────
    const starCount = 280
    const starPos = new Float32Array(starCount * 3)
    const starCol = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const o = i * 3
      starPos[o] = (Math.random() - 0.5) * 36
      starPos[o + 1] = (Math.random() - 0.5) * 22
      starPos[o + 2] = -Math.random() * 40 + 5
      const t = 0.7 + Math.random() * 0.3
      starCol[o] = t * 0.78; starCol[o + 1] = t * 0.9; starCol[o + 2] = t
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3))
    const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true }))
    scene.add(starField)

    // ── Earth (source) ────────────────────────────────────────────────────────
    const earthGroup = new THREE.Group()
    earthGroup.position.set(-4.2, -1.8, -1)
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 40, 26),
      new THREE.MeshStandardMaterial({ color: 0x1a5fa8, roughness: 0.72, metalness: 0.08, emissive: 0x061e40, emissiveIntensity: 0.55 }),
    )
    earthGroup.add(earth)
    // atmosphere
    earthGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.48, 32, 20),
      new THREE.MeshBasicMaterial({ color: 0x2ebcff, transparent: true, opacity: 0.11, side: THREE.BackSide }),
    ))
    // land patches
    for (let i = 0; i < 10; i++) {
      const patch = new THREE.Mesh(
        new THREE.SphereGeometry(0.1 + Math.random() * 0.18, 8, 6),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0x2e8c60 : 0x5e9672, roughness: 0.9 }),
      )
      const phi = Math.random() * Math.PI * 2
      const theta = (Math.random() - 0.5) * Math.PI
      patch.position.set(Math.cos(theta) * Math.cos(phi) * 1.36, Math.sin(theta) * 1.36, Math.cos(theta) * Math.sin(phi) * 1.36)
      patch.lookAt(0, 0, 0)
      patch.scale.set(1.5, 0.28, 0.18)
      earth.add(patch)
    }
    scene.add(earthGroup)

    // ── Destination planet ────────────────────────────────────────────────────
    const destCol = destinationColor ?? DEST_COLORS.default
    const destMat = new THREE.MeshStandardMaterial({ color: destCol, roughness: 0.88, metalness: 0.04, emissive: destCol, emissiveIntensity: 0.14 })
    const destPlanet = new THREE.Mesh(new THREE.SphereGeometry(1.1, 40, 26), destMat)
    destPlanet.position.set(4.0, 1.4, -5)
    scene.add(destPlanet)

    // Destination glow halo
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.22, 28, 18),
      new THREE.MeshBasicMaterial({ color: destCol, transparent: true, opacity: 0.07, side: THREE.BackSide }),
    ))
    const destGlowMesh = scene.children[scene.children.length - 1] as THREE.Mesh
    destGlowMesh.position.copy(destPlanet.position)

    // Mars equatorial band / Ganymede ring / Moon craters
    if (destinationColor === DEST_COLORS.mars || destinationColor === 0xd4582a) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.045, 6, 48), new THREE.MeshStandardMaterial({ color: 0x8a2a10, transparent: true, opacity: 0.45, roughness: 1 }))
      band.rotation.x = Math.PI / 2
      destPlanet.add(band)
    } else if (destinationColor === DEST_COLORS.ganymede || destinationColor === 0x9566cc) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.06, 6, 60), new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.42 }))
      ring.rotation.x = Math.PI / 2.5
      destPlanet.add(ring)
    } else if (destinationColor === DEST_COLORS['earth-orbit'] || destinationColor === 0x2a7ecf) {
      // ISS-like station ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.03, 6, 60), new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.55 }))
      ring.rotation.x = Math.PI / 3
      destPlanet.add(ring)
    }

    // ── Flight path arc ───────────────────────────────────────────────────────
    const arc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.0, -1.4, -0.5),
      new THREE.Vector3(-1.5, 0.8, -1.5),
      new THREE.Vector3(0.5, 1.8, -2.5),
      new THREE.Vector3(2.5, 1.8, -3.5),
      new THREE.Vector3(3.6, 1.6, -4.5),
    ])
    const arcLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arc.getPoints(60)),
      new THREE.LineBasicMaterial({ color: 0x35dff4, transparent: true, opacity: 0.28 }),
    )
    scene.add(arcLine)

    // ── Rocket ────────────────────────────────────────────────────────────────
    const rocket = new THREE.Group()
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, metalness: 0.62, roughness: 0.2 })
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xe8421a, metalness: 0.45, roughness: 0.28 })
    const finMat  = new THREE.MeshStandardMaterial({ color: 0xe03318, metalness: 0.52, roughness: 0.26 })
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a2e42, metalness: 0.82, roughness: 0.2 })

    // lathe body
    const lathePoints = [
      new THREE.Vector2(0.0, -0.22),
      new THREE.Vector2(0.072, -0.18),
      new THREE.Vector2(0.064, -0.06),
      new THREE.Vector2(0.055, 0.1),
      new THREE.Vector2(0.052, 0.22),
    ]
    rocket.add(new THREE.Mesh(new THREE.LatheGeometry(lathePoints, 12), bodyMat))
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.16, 12), noseMat)
    nose.position.y = 0.3
    rocket.add(nose)
    const accent = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.022, 12), new THREE.MeshStandardMaterial({ color: 0xe03318, metalness: 0.55, roughness: 0.22 }))
    accent.position.y = -0.04
    rocket.add(accent)
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.055, 0.08, 12), darkMat)
    eng.position.y = -0.26
    rocket.add(eng)
    // 4 fins
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.16, 0.12), finMat)
      fin.position.set(Math.cos(i * Math.PI / 2) * 0.08, -0.16, Math.sin(i * Math.PI / 2) * 0.08)
      fin.rotation.y = i * Math.PI / 2
      rocket.add(fin)
    }
    // dual-cone flame
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x69f3ff, transparent: true, opacity: 0.8 })
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.38, 10), flameMat)
    flame.rotation.x = Math.PI; flame.position.y = -0.44
    const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.68 })
    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.22, 8), innerFlameMat)
    innerFlame.rotation.x = Math.PI; innerFlame.position.y = -0.38
    rocket.add(flame, innerFlame)
    scene.add(rocket)

    // ── Animation ─────────────────────────────────────────────────────────────
    let rocketT = 0   // 0..1 along arc
    const clock = new THREE.Clock()
    let frame = 0

    const animate = () => {
      frame = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.getElapsedTime()

      // advance rocket along arc, loop back
      rocketT = (rocketT + delta * 0.055) % 1
      const pos = arc.getPoint(rocketT)
      const ahead = arc.getPoint(Math.min(1, rocketT + 0.025))
      rocket.position.copy(pos)

      // orient rocket to path tangent
      const tangent = new THREE.Vector3().subVectors(ahead, pos).normalize()
      rocket.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent), Math.min(1, delta * 7))

      // flame flicker
      flame.scale.y = 0.8 + Math.sin(elapsed * 20) * 0.22
      innerFlame.scale.y = 0.7 + Math.sin(elapsed * 28) * 0.18
      flameMat.opacity = 0.68 + Math.sin(elapsed * 15) * 0.14
      innerFlameMat.opacity = 0.55 + Math.sin(elapsed * 22) * 0.18

      // planet rotations
      earth.rotation.y += delta * 0.07
      destPlanet.rotation.y += delta * 0.05

      // slow star drift
      starField.rotation.z += delta * 0.004
      starField.rotation.x += delta * 0.001

      // gentle camera bob
      camera.position.y = Math.sin(elapsed * 0.22) * 0.06
      camera.position.x = Math.sin(elapsed * 0.18) * 0.04

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = mount.offsetWidth || 340
      const h = mount.offsetHeight || 220
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry.dispose()
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach(m => m.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [destinationColor])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, flex: 1 }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: 0 }} />
      {/* overlay label */}
      <div style={{
        position: 'absolute', bottom: 8, left: 10,
        display: 'flex', flexDirection: 'column', gap: 2, pointerEvents: 'none',
      }}>
        <span style={{ color: accentColor, font: '7px ui-monospace, monospace', letterSpacing: '0.15em', opacity: 0.75 }}>
          LAUNCH SIMULATION
        </span>
        <span style={{ color: '#d0e8f2', font: '9px/1.3 system-ui, sans-serif', fontWeight: 500 }}>
          {destinationLabel}
        </span>
      </div>
      <div style={{
        position: 'absolute', top: 8, right: 10, pointerEvents: 'none',
        width: 5, height: 5, borderRadius: '50%',
        background: accentColor,
        boxShadow: `0 0 8px ${accentColor}`,
        animation: 'pulse 2s infinite',
      }} />
    </div>
  )
}
