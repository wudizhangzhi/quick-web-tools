// An A4 sheet lying on a desk, seen straight from above. Grab the paper and it
// curls up like real paper (see lib/paper-desk/curl.ts — an inextensible page
// curl, not cloth); let go and it springs back flat with a small slap.
//
// Rendering the sheet's printed face from a live canvas texture was inspired by
// "Kimi K3.1 pro" by Chetas (MIT License),
// https://codepen.io/editor/ChetasLua/pen/01a167ec-728f-7ddf-8fb6-01ee3015c05f
import type * as THREE_NS from 'three'
import { PAPER_H, PAPER_STYLES, PAPER_W, type PaperConfig } from '@/lib/paper-desk/config'
import { contactShadow, drawDesk, drawPaper, drawStamp, paperGrain, rng, shredderPanel, TEX_H, TEX_W } from '@/lib/paper-desk/draw'
import { curlPoint, solveCurl } from '@/lib/paper-desk/curl'
import { SHRED_DEPTH, PILE_REACH, shredPoint, stripParams, type StripParams } from '@/lib/paper-desk/shred'
import type { Sfx } from './sound'

type Three = typeof THREE_NS

export interface PaperScene {
  setConfig(cfg: PaperConfig): void
  redrawPaper(): void
  /** Press the approval stamp onto the paper (animated). */
  stamp(): Promise<void>
  setStamped(on: boolean): void
  /** Feed the paper into a shredder (animated). */
  shred(): Promise<void>
  /** Resolves once the opening drop has landed (immediately when there is none). */
  whenLanded(): Promise<void>
  zoomBy(factor: number): void
  resetView(): void
  snapshot(): Promise<Blob | null>
  dispose(): void
}

const LIFT = 0.003 // paper rests just above the desk to avoid z-fighting
const R_MIN = 0.16 // tightest radius the paper bends to — this is its stiffness
const GRAB_PLANE_Y = 0.25 // pointer is projected onto this height while dragging
const YAW = -0.012 // a hair off-square, like a sheet someone just put down

export function createPaperScene(
  container: HTMLElement,
  THREE: Three,
  initial: PaperConfig,
  opts: {
    stamped?: boolean
    shredded?: boolean // show the result of an earlier rejection, no animation
    dropIn?: boolean // open with the sheet falling onto the desk
    padBottom?: number
    margin?: number
    sfx?: Sfx
  } = {},
): PaperScene {
  let cfg = initial
  let stamped = !!opts.stamped
  const sfx = opts.sfx
  const small = Math.min(container.clientWidth, window.innerWidth) < 640

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const canvas = renderer.domElement
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.touchAction = 'none'
  container.appendChild(canvas)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1410)
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60)
  camera.up.set(0, 0, -1) // looking straight down: screen-up is the far edge of the desk
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x)
  const aniso = renderer.capabilities.getMaxAnisotropy()

  /* ---------- lights: warm desk lamp from the top-left + soft fill ---------- */
  const hemi = new THREE.HemisphereLight(0xfff1dc, 0x3a2a1c, 0.7)
  const lamp = new THREE.SpotLight(0xffe2b8, 75, 20, Math.PI / 4.2, 0.75, 1.5)
  lamp.position.set(-3.2, 6.5, -2.6)
  lamp.target.position.set(0.3, 0, 0.4)
  lamp.castShadow = true
  lamp.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048)
  lamp.shadow.bias = -0.0004
  lamp.shadow.normalBias = 0.012
  lamp.shadow.radius = 4
  const fill = new THREE.DirectionalLight(0xc8d8ff, 0.3)
  fill.position.set(4, 5, 4)
  scene.add(hemi, lamp, lamp.target, fill)

  /* ---------- desk ---------- */
  const deskTex = track(new THREE.CanvasTexture(drawDesk(cfg.desk)))
  deskTex.colorSpace = THREE.SRGBColorSpace
  deskTex.anisotropy = aniso
  const desk = new THREE.Mesh(
    track(new THREE.PlaneGeometry(12, 12)),
    track(new THREE.MeshStandardMaterial({ map: deskTex, roughness: 0.55 })),
  )
  desk.rotation.x = -Math.PI / 2
  desk.receiveShadow = true
  scene.add(desk)
  let deskKey = cfg.desk

  // a flat sheet casts almost no shadow from above — fake the contact shadow
  const shadowTex = track(new THREE.CanvasTexture(contactShadow()))
  const contact = new THREE.Mesh(
    track(new THREE.PlaneGeometry(PAPER_W * (512 / 400), PAPER_H * (640 / 528))),
    track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.4, depthWrite: false })),
  )
  contact.rotation.set(-Math.PI / 2, 0, YAW)
  contact.position.set(0.03, 0.001, 0.05)
  scene.add(contact)

  /* ---------- props: a mug and a pencil, half out of frame ---------- */
  {
    const ceramic = track(new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.35 }))
    const pts = [
      [0, 0], [0.3, 0], [0.32, 0.02], [0.33, 0.62], [0.3, 0.62], [0.29, 0.06], [0, 0.06],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const mug = new THREE.Mesh(track(new THREE.LatheGeometry(pts, 48)), ceramic)
    const handle = new THREE.Mesh(track(new THREE.TorusGeometry(0.15, 0.035, 12, 32, Math.PI * 1.2)), ceramic)
    handle.position.set(0.33, 0.33, 0)
    handle.rotation.z = -Math.PI * 0.6
    const coffee = new THREE.Mesh(
      track(new THREE.CircleGeometry(0.29, 40)),
      track(new THREE.MeshStandardMaterial({ color: 0x2b1608, roughness: 0.15 })),
    )
    coffee.rotation.x = -Math.PI / 2
    coffee.position.y = 0.5
    const g = new THREE.Group()
    g.add(mug, handle, coffee)
    g.position.set(PAPER_W / 2 + 0.95, 0, -PAPER_H / 2 + 0.35)
    g.rotation.y = 0.9
    g.traverse((o) => ((o as THREE_NS.Mesh).castShadow = true))
    scene.add(g)

    const wood = track(new THREE.MeshStandardMaterial({ color: 0xe7b347, roughness: 0.5 }))
    const body = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 6)), wood)
    const tip = new THREE.Mesh(
      track(new THREE.ConeGeometry(0.035, 0.14, 6)),
      track(new THREE.MeshStandardMaterial({ color: 0xe9cfa4, roughness: 0.8 })),
    )
    tip.position.y = 0.82
    const lead = new THREE.Mesh(
      track(new THREE.ConeGeometry(0.012, 0.05, 6)),
      track(new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 })),
    )
    lead.position.y = 0.9
    const eraser = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.036, 0.036, 0.12, 12)),
      track(new THREE.MeshStandardMaterial({ color: 0xd9827a, roughness: 0.9 })),
    )
    eraser.position.y = -0.81
    const pencil = new THREE.Group()
    pencil.add(body, tip, lead, eraser)
    pencil.rotation.set(Math.PI / 2, 0, 0.35)
    pencil.position.set(-PAPER_W / 2 - 0.55, 0.035, PAPER_H / 2 - 0.5)
    pencil.traverse((o) => ((o as THREE_NS.Mesh).castShadow = true))
    scene.add(pencil)
  }

  /* ---------- paper texture (plain text layer + optional stamp on top) ---------- */
  const plainCanvas = document.createElement('canvas')
  const paperCanvas = document.createElement('canvas')
  paperCanvas.width = TEX_W
  paperCanvas.height = TEX_H
  const pg = paperCanvas.getContext('2d')!
  let stampAt = drawPaper(plainCanvas, cfg)
  const paperTex = track(new THREE.CanvasTexture(paperCanvas))
  paperTex.colorSpace = THREE.SRGBColorSpace
  paperTex.anisotropy = aniso
  function compose(stampT: number) {
    pg.drawImage(plainCanvas, 0, 0)
    if (stampT > 0) drawStamp(pg, cfg.stampText, stampAt, stampT)
    paperTex.needsUpdate = true
  }
  compose(stamped ? 1 : 0)

  const grainTex = track(new THREE.CanvasTexture(paperGrain()))
  grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping
  grainTex.repeat.set(3, 4)
  const frontMat = track(
    new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.92, bumpMap: grainTex, bumpScale: 0.5, side: THREE.FrontSide }),
  )
  const backMat = track(
    new THREE.MeshStandardMaterial({
      color: PAPER_STYLES[cfg.style].base,
      roughness: 0.95,
      bumpMap: grainTex,
      bumpScale: 0.5,
      side: THREE.BackSide,
    }),
  )

  /* ---------- paper mesh ---------- */
  const NX = small ? 30 : 44, NY = small ? 42 : 62
  const CX = NX + 1, N = CX * (NY + 1)
  const restX = new Float32Array(N), restZ = new Float32Array(N)
  const pos = new Float32Array(N * 3)
  const id = (i: number, j: number) => j * CX + i
  const uv = new Float32Array(N * 2)
  const idx: number[] = []
  for (let j = 0; j <= NY; j++)
    for (let i = 0; i <= NX; i++) {
      const n = id(i, j)
      restX[n] = -PAPER_W / 2 + (i / NX) * PAPER_W
      restZ[n] = -PAPER_H / 2 + (j / NY) * PAPER_H
      uv[n * 2] = i / NX
      uv[n * 2 + 1] = 1 - j / NY
    }
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const a = id(i, j), b = id(i + 1, j), c = id(i, j + 1), d = id(i + 1, j + 1)
      idx.push(a, c, b, b, c, d)
    }
  const geo = track(new THREE.BufferGeometry())
  const posAttr = new THREE.BufferAttribute(pos, 3)
  posAttr.setUsage(THREE.DynamicDrawUsage)
  geo.setAttribute('position', posAttr)
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geo.setIndex(idx)
  const front = new THREE.Mesh(geo, frontMat)
  const back = new THREE.Mesh(geo, backMat)
  for (const m of [front, back]) {
    m.castShadow = true
    m.receiveShadow = true
    m.frustumCulled = false
    scene.add(m)
  }

  /* ---------- curl state ---------- */
  const cy = Math.cos(YAW), sy = Math.sin(YAW)
  const curl = {
    ax: 0, az: 0, // grabbed point, paper-local
    dx: 0, dz: 1, // curl direction (unit, paper-local): from the fold line toward the grabbed point
    s: 0, R: R_MIN, vel: 0,
    ts: 0, tR: R_MIN, tdx: 0, tdz: 1, // targets while dragging
  }
  let dirty = true

  function writeVertices() {
    const { ax, az, dx, dz, s, R } = curl
    const lx = ax - dx * s, lz = az - dz * s // a point on the fold line
    for (let n = 0; n < N; n++) {
      const px = restX[n], pz = restZ[n]
      const t = (px - lx) * dx + (pz - lz) * dz
      let x = px, z = pz, y = LIFT
      if (t > 0 && s > 0) {
        const c = curlPoint(t, R)
        x += dx * (c.along - t)
        z += dz * (c.along - t)
        // the part folded over sits a hair above the part underneath
        y += c.height * (1 + 0.012)
      }
      const k = n * 3
      pos[k] = x * cy - z * sy
      pos[k + 1] = y
      pos[k + 2] = x * sy + z * cy
    }
    posAttr.needsUpdate = true
    geo.computeVertexNormals()
    geo.computeBoundingSphere()
  }

  // farthest the fold line may travel back from the grabbed point and stay on the sheet
  function sMaxFor(ax: number, az: number, dx: number, dz: number) {
    let min = Infinity
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      min = Math.min(min, (cx * PAPER_W) / 2 * dx + (cz * PAPER_H) / 2 * dz)
    }
    return Math.max(0, (ax * dx + az * dz - min) * 0.82)
  }

  /* ---------- camera: straight down; zoomable (wheel / pinch / double-tap), pannable when zoomed ---------- */
  const pad = opts.padBottom ?? 0 // leaves desk free below the sheet for overlaid buttons
  const MAX_ZOOM = 4
  const view = {
    base: 7, halfW: 1, halfH: 1, zoom: 1, cx: 0, cz: pad / 2, tzoom: 1, tcx: 0, tcz: pad / 2, snap: true,
    locked: false, // a scripted shot (the shredder) owns the camera
  }
  const tanV = () => Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)

  function clampView() {
    if (view.locked) return
    view.tzoom = Math.min(MAX_ZOOM, Math.max(1, view.tzoom))
    // never show anything outside the zoomed-out framing
    const k = 1 - 1 / view.tzoom
    const rx = view.halfW * k, rz = view.halfH * k
    view.tcx = Math.min(rx, Math.max(-rx, view.tcx))
    view.tcz = Math.min(pad / 2 + rz, Math.max(pad / 2 - rz, view.tcz))
  }
  function zoomAt(factor: number, wx: number, wz: number) {
    const nz = Math.min(MAX_ZOOM, Math.max(1, view.tzoom * factor))
    const ratio = view.tzoom / nz
    view.tcx = wx + (view.tcx - wx) * ratio
    view.tcz = wz + (view.tcz - wz) * ratio
    view.tzoom = nz
    clampView()
  }
  function applyView(dt: number) {
    const k = view.snap ? 1 : 1 - Math.exp(-dt * 12)
    view.snap = false
    view.zoom += (view.tzoom - view.zoom) * k
    view.cx += (view.tcx - view.cx) * k
    view.cz += (view.tcz - view.cz) * k
    camera.position.set(view.cx, view.base / view.zoom, view.cz)
    camera.lookAt(view.cx, 0, view.cz)
  }
  // world units per CSS pixel at the current target zoom
  const worldPerPx = () => (2 * (view.base / view.tzoom) * tanV()) / Math.max(1, container.clientHeight)

  function resize() {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const tv = tanV(), th = tv * camera.aspect
    const m = opts.margin ?? 0.7 // desk shown around the sheet when fully zoomed out
    view.base = Math.max((PAPER_H + m + pad) / 2 / tv, (PAPER_W + m) / 2 / th)
    view.halfW = view.base * th
    view.halfH = view.base * tv
    clampView()
    view.snap = true
    dirty = true
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  /* ---------- interaction ---------- */
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const grabPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GRAB_PLANE_Y)
  const deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const hitPt = new THREE.Vector3()
  const grab = { active: false, pointer: -1, d0x: 0, d0z: 1 }
  const pointers = new Map<number, { x: number; y: number }>()
  let pan: { x: number; y: number } | null = null
  let pinch: { d0: number; z0: number; wx: number; wz: number; cx0: number; cz0: number; mx: number; my: number } | null = null
  let lastTap = { t: 0, x: 0, y: 0 }

  function setNdc(x: number, y: number) {
    const r = canvas.getBoundingClientRect()
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
  }
  function deskPoint(x: number, y: number): [number, number] {
    setNdc(x, y)
    return ray.ray.intersectPlane(deskPlane, hitPt) ? [hitPt.x, hitPt.z] : [view.cx, view.cz]
  }
  function toLocal(wx: number, wz: number): [number, number] {
    return [wx * cy + wz * sy, -wx * sy + wz * cy]
  }
  const zoomedIn = () => view.tzoom > 1.05

  function beginCurl(e: PointerEvent) {
    setNdc(e.clientX, e.clientY)
    const hit = ray.intersectObjects([front, back], false)[0]
    if (!hit?.uv) return
    const ax = (hit.uv.x - 0.5) * PAPER_W
    const az = (0.5 - hit.uv.y) * PAPER_H
    const len = Math.hypot(ax, az)
    grab.d0x = len > 1e-3 ? ax / len : 0
    grab.d0z = len > 1e-3 ? az / len : 1
    // a flat sheet is re-anchored at the grab point; a sheet still springing back keeps
    // its current curl (re-anchoring mid-curl would make the fold line jump)
    if (curl.s <= 1e-3) {
      curl.ax = ax; curl.az = az
      curl.dx = curl.tdx = grab.d0x
      curl.dz = curl.tdz = grab.d0z
      curl.s = curl.ts = 0
    } else {
      const l = Math.hypot(curl.ax, curl.az) || 1
      grab.d0x = curl.ax / l
      grab.d0z = curl.az / l
      curl.ts = curl.s
    }
    curl.vel = 0
    grab.active = true
    grab.pointer = e.pointerId
    canvas.style.cursor = 'grabbing'
  }
  function moveCurl(e: PointerEvent) {
    setNdc(e.clientX, e.clientY)
    if (!ray.ray.intersectPlane(grabPlane, hitPt)) return
    const [tx, tz] = toLocal(hitPt.x, hitPt.z)
    const vx = curl.ax - tx, vz = curl.az - tz
    const vlen = Math.hypot(vx, vz)
    // pull toward the sheet's interior curls it; pulling outward just leaves it flat
    let dx = grab.d0x, dz = grab.d0z
    if (vlen > 1e-3 && (vx / vlen) * grab.d0x + (vz / vlen) * grab.d0z > 0.3) {
      dx = vx / vlen
      dz = vz / vlen
    }
    const pull = Math.max(0, vx * dx + vz * dz)
    const lift = 0.12 + 0.45 * Math.min(pull, 1.5)
    const c = solveCurl(pull, lift, R_MIN, sMaxFor(curl.ax, curl.az, dx, dz))
    curl.ts = c.s
    curl.tR = c.R
    curl.tdx = dx
    curl.tdz = dz
  }
  const endCurl = () => {
    if (!grab.active) return
    sfx?.rustle(0)
    grab.active = false
    canvas.style.cursor = ''
  }
  function startPinch() {
    const [p1, p2] = [...pointers.values()]
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2
    const [wx, wz] = deskPoint(mx, my)
    pinch = { d0: Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1, z0: view.tzoom, wx, wz, cx0: view.tcx, cz0: view.tcz, mx, my }
  }

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    sfx?.unlock()
    if (busy()) return
    e.preventDefault()
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {}
    if (pointers.size >= 2) {
      // a second finger means zoom: drop whatever the first finger was doing
      endCurl()
      pan = null
      startPinch()
      return
    }
    // double-tap / double-click toggles a close-up of that spot
    const now = performance.now()
    if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
      lastTap.t = 0
      endCurl()
      if (zoomedIn()) {
        view.tzoom = 1
        clampView()
      } else {
        const [wx, wz] = deskPoint(e.clientX, e.clientY)
        zoomAt(2.4, wx, wz)
      }
      return
    }
    lastTap = { t: now, x: e.clientX, y: e.clientY }
    if (zoomedIn()) {
      pan = { x: e.clientX, y: e.clientY }
      canvas.style.cursor = 'grabbing'
    } else beginCurl(e)
  }
  let hoverTick = 0
  const onMove = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId)
    if (p) {
      p.x = e.clientX
      p.y = e.clientY
    }
    if (pinch && pointers.size >= 2) {
      const [p1, p2] = [...pointers.values()]
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y)
      const nz = Math.min(MAX_ZOOM, Math.max(1, (pinch.z0 * d) / pinch.d0))
      view.tzoom = nz
      view.tcx = pinch.wx + (pinch.cx0 - pinch.wx) * (pinch.z0 / nz)
      view.tcz = pinch.wz + (pinch.cz0 - pinch.wz) * (pinch.z0 / nz)
      const wpp = worldPerPx()
      view.tcx -= ((p1.x + p2.x) / 2 - pinch.mx) * wpp
      view.tcz -= ((p1.y + p2.y) / 2 - pinch.my) * wpp
      clampView()
      return
    }
    if (pan && p) {
      const wpp = worldPerPx()
      view.tcx -= (e.clientX - pan.x) * wpp
      view.tcz -= (e.clientY - pan.y) * wpp
      pan = { x: e.clientX, y: e.clientY }
      clampView()
      return
    }
    if (grab.active && e.pointerId === grab.pointer) {
      moveCurl(e)
      return
    }
    if (e.pointerType === 'mouse' && !p && (hoverTick = (hoverTick + 1) % 3) === 0) {
      setNdc(e.clientX, e.clientY)
      canvas.style.cursor = zoomedIn() ? 'grab' : ray.intersectObjects([front, back], false).length ? 'grab' : ''
    }
  }
  const onUp = (e: PointerEvent) => {
    if (!pointers.delete(e.pointerId)) return
    if (e.pointerId === grab.pointer) endCurl()
    if (pinch && pointers.size < 2) {
      pinch = null
      lastTap.t = 0 // lifting the fingers after a pinch is not a tap
      // the finger still down keeps panning
      const rest = [...pointers.values()][0]
      pan = rest && zoomedIn() ? { x: rest.x, y: rest.y } : null
    }
    if (pointers.size === 0) {
      pan = null
      canvas.style.cursor = ''
    }
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    if (busy()) return
    const [wx, wz] = deskPoint(e.clientX, e.clientY)
    zoomAt(Math.exp(-e.deltaY * 0.0018), wx, wz)
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  const ends = ['pointerup', 'pointercancel'] as const
  ends.forEach((t) => canvas.addEventListener(t, onUp))

  /* ---------- shredder (built on first use) ---------- */
  const CUT_Z = -PAPER_H / 2 // the cutting line sits on the sheet's top edge
  // the sheet's bottom edge just clears the outlet: strips spread over the whole pile instead of bunching at its far end
  const FEED_END = PAPER_H + SHRED_DEPTH + 0.12
  const shredState = { active: false, built: false, f: 0, t: 0, resolve: null as null | (() => void) }
  let shredder: THREE_NS.Group | null = null
  let panelTex: THREE_NS.CanvasTexture | null = null
  let stripGeo: THREE_NS.BufferGeometry | null = null
  let stripMeshes: THREE_NS.Mesh[] = []
  let stripRest: { x: Float32Array; z: Float32Array; k: Uint16Array } | null = null
  let stripPos: Float32Array | null = null
  let strips: StripParams[] = []

  function setPanel(status: string, active: boolean) {
    if (!panelTex) return
    panelTex.image = shredderPanel(status, active)
    panelTex.needsUpdate = true
  }

  function buildShredder() {
    if (shredState.built) return
    shredState.built = true
    const W = PAPER_W + 0.7, H = 0.42
    shredder = new THREE.Group()
    const shell = track(new THREE.MeshStandardMaterial({ color: 0x2c2e33, roughness: 0.45, metalness: 0.2 }))
    const body = new THREE.Mesh(track(new THREE.BoxGeometry(W, H, SHRED_DEPTH)), shell)
    body.position.y = H / 2
    panelTex = track(new THREE.CanvasTexture(shredderPanel('待命', false)))
    panelTex.colorSpace = THREE.SRGBColorSpace
    const panel = new THREE.Mesh(
      track(new THREE.PlaneGeometry(W * 0.96, SHRED_DEPTH * 0.8)),
      track(new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.5 })),
    )
    panel.rotation.x = -Math.PI / 2
    panel.position.y = H + 0.001
    // the feed slot: a dark lip along the side facing the paper
    const slot = new THREE.Mesh(
      track(new THREE.BoxGeometry(PAPER_W + 0.12, 0.05, 0.04)),
      track(new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.8 })),
    )
    slot.position.set(0, 0.04, SHRED_DEPTH / 2 + 0.01)
    shredder.add(body, panel, slot)
    shredder.traverse((o) => ((o as THREE_NS.Mesh).castShadow = true))
    shredder.position.set(0, 0, CUT_Z - SHRED_DEPTH / 2)
    shredder.visible = false
    scene.add(shredder)

    // strips: the same printed sheet, cut lengthwise
    const K = small ? 18 : 26, M = small ? 60 : 90
    const r = rng(7)
    strips = Array.from({ length: K }, (_, k) => stripParams(k, K, r))
    const V = K * 2 * (M + 1)
    const sx = new Float32Array(V), sz = new Float32Array(V), sk = new Uint16Array(V)
    const suv = new Float32Array(V * 2)
    const sidx: number[] = []
    let v = 0
    for (let k = 0; k < K; k++) {
      const base = v
      for (let row = 0; row <= M; row++) {
        for (const side of [0, 1]) {
          const u = (k + side) / K
          sx[v] = (u - 0.5) * PAPER_W
          sz[v] = -PAPER_H / 2 + (row / M) * PAPER_H
          sk[v] = k
          suv[v * 2] = u
          suv[v * 2 + 1] = 1 - row / M
          v++
        }
      }
      for (let row = 0; row < M; row++) {
        const a = base + row * 2, b = a + 1, c = a + 2, d = a + 3
        sidx.push(a, c, b, b, c, d)
      }
    }
    stripRest = { x: sx, z: sz, k: sk }
    stripPos = new Float32Array(V * 3)
    stripGeo = track(new THREE.BufferGeometry())
    const attr = new THREE.BufferAttribute(stripPos, 3)
    attr.setUsage(THREE.DynamicDrawUsage)
    stripGeo.setAttribute('position', attr)
    stripGeo.setAttribute('uv', new THREE.BufferAttribute(suv, 2))
    stripGeo.setIndex(sidx)
    stripMeshes = [new THREE.Mesh(stripGeo, frontMat), new THREE.Mesh(stripGeo, backMat)]
    for (const m of stripMeshes) {
      m.castShadow = true
      m.receiveShadow = true
      m.frustumCulled = false
      m.visible = false
      scene.add(m)
    }
  }

  function writeStrips(f: number) {
    if (!stripRest || !stripPos || !stripGeo) return
    const { x, z, k } = stripRest
    for (let v = 0; v < x.length; v++) {
      const d = f - (z[v] - CUT_Z) // distance this point has travelled past the cutting line
      const o = shredPoint(d, strips[k[v]], LIFT)
      const px = x[v] + o.dx
      const pz = CUT_Z + o.dz
      const i = v * 3
      stripPos[i] = px * cy - pz * sy
      stripPos[i + 1] = o.hidden ? LIFT : o.y
      stripPos[i + 2] = px * sy + pz * cy
    }
    stripGeo.attributes.position.needsUpdate = true
    stripGeo.computeVertexNormals()
  }

  // frame the shredder, the sheet going in and the pile coming out; once the sheet
  // is gone (`after`), close in on just the machine and the pile
  function shredShot(after = false) {
    const top = CUT_Z - SHRED_DEPTH - PILE_REACH - 0.35
    const bottom = after ? CUT_Z + 0.55 : PAPER_H / 2 + 0.25
    const needH = bottom - top
    const fitH = view.halfH * 2
    view.locked = true
    // fit both ways: on a portrait phone the machine's width is what limits the shot
    const needW = PAPER_W + 0.7 + 0.3
    view.tzoom = Math.min(after ? 1.25 : 1, fitH / (needH + pad), (view.halfW * 2) / needW)
    view.tcx = 0
    view.tcz = (top + bottom) / 2 + pad / 2 / view.tzoom
  }

  function startShredMeshes() {
    buildShredder()
    for (const m of [front, back]) m.visible = false
    contact.visible = false
    for (const m of stripMeshes) m.visible = true
    shredder!.visible = true
  }

  /* ---------- drop-in: the sheet falls from above and lands on the desk ---------- */
  const drop = { active: false, t: 0, dur: 1.7, h0: 4 }
  let markLanded: () => void = () => {}
  const landed = new Promise<void>((r) => (markLanded = r))
  const busy = () => drop.active || shredState.active || view.locked
  function setPaperPose(h: number, rx: number, rz: number, x: number) {
    for (const m of [front, back]) {
      m.position.set(x, h, 0)
      m.rotation.set(rx, 0, rz)
    }
  }

  /* ---------- loop ---------- */
  const clock = new THREE.Clock()
  let raf = 0
  let stampAnim: { t: number; resolve: () => void } | null = null
  let shake = 0

  function frame() {
    const dt = Math.min(clock.getDelta(), 1 / 20)
    if (drop.active) {
      drop.t += dt
      const p = Math.min(1, drop.t / drop.dur)
      const left = 1 - p
      // near terminal velocity: almost linear fall, with an easy start
      const h = drop.h0 * (1 - (0.35 * p + 0.65 * p * p * (3 - 2 * p)))
      const w = drop.t * 5.2
      setPaperPose(LIFT + h, Math.sin(w) * 0.32 * left, Math.sin(w * 0.7 + 1) * 0.22 * left, Math.sin(w * 0.5) * 0.35 * left)
      ;(contact.material as THREE_NS.MeshBasicMaterial).opacity = 0.4 * p * p
      contact.scale.setScalar(1 + left * 0.5)
      if (p >= 1) {
        drop.active = false
        markLanded()
        sfx?.land()
        setPaperPose(0, 0, 0, 0)
        contact.scale.setScalar(1)
        shake = 0.5
        navigator.vibrate?.(25)
        // land with a corner still lifted, then let it slap down
        curl.s = introCurl.s
        curl.R = curl.tR = introCurl.R
        curl.vel = 0
        dirty = true
      }
    }
    if (shredState.active) {
      shredState.t += dt
      const t = shredState.t
      // 0–0.6s: machine slides in; 0.6–0.9s: spins up; then feed with a slightly uneven bite
      const slide = Math.min(1, t / 0.6)
      shredder!.position.z = CUT_Z - SHRED_DEPTH / 2 - (1 - slide) ** 3 * 5
      if (t > 0.6 && t - dt <= 0.6) {
        setPanel('粉碎中', true)
        sfx?.shredStart()
      }
      if (t > 0.9 && t - dt <= 0.9) sfx?.shredFeed(true)
      if (t > 0.9) {
        const bite = 0.85 + 0.3 * Math.abs(Math.sin(t * 23))
        shredState.f = Math.min(FEED_END, shredState.f + dt * 1.35 * bite)
        shake = Math.max(shake, 0.18)
        writeStrips(shredState.f)
        if (Math.random() < dt * 6) navigator.vibrate?.(15)
      }
      if (shredState.f >= FEED_END) {
        shredState.active = false
        setPanel('已粉碎', false)
        sfx?.shredFeed(false)
        sfx?.shredStop()
        shake = 0.6
        shredShot(true)
        shredState.resolve?.()
        shredState.resolve = null
      }
    }
    if (grab.active) {
      const k = 1 - Math.exp(-dt * 16)
      sfx?.rustle(Math.abs(curl.ts - curl.s) * k / Math.max(dt, 1e-3))
      curl.s += (curl.ts - curl.s) * k
      curl.R += (curl.tR - curl.R) * k
      const dx = curl.dx + (curl.tdx - curl.dx) * k, dz = curl.dz + (curl.tdz - curl.dz) * k
      const l = Math.hypot(dx, dz) || 1
      curl.dx = dx / l
      curl.dz = dz / l
      dirty = true
    } else if (curl.s > 0 || curl.vel !== 0) {
      sfx?.rustle(0)
      // released: spring back flat, slap the desk, settle
      curl.vel += (-55 * curl.s - 6 * curl.vel) * dt
      curl.s += curl.vel * dt
      if (curl.s < 0) {
        curl.s = 0
        sfx?.slap(Math.abs(curl.vel) / 2.5)
        curl.vel = Math.abs(curl.vel) > 0.25 ? -curl.vel * 0.22 : 0
      }
      dirty = true
    }
    if (dirty) {
      writeVertices()
      dirty = false
    }
    if (stampAnim) {
      stampAnim.t = Math.min(1, stampAnim.t + dt / 0.32)
      compose(stampAnim.t)
      if (stampAnim.t >= 1) {
        shake = 1
        sfx?.stamp()
        stampAnim.resolve()
        stampAnim = null
      }
    }
    applyView(dt)
    if (shake > 0) {
      shake = Math.max(0, shake - dt * 4)
      camera.position.x += (Math.random() - 0.5) * 0.06 * shake
      camera.position.z += (Math.random() - 0.5) * 0.06 * shake
    }
    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }

  resize()
  // intro: the sheet lands with its bottom-right corner still curled, then flops flat
  curl.ax = PAPER_W / 2
  curl.az = PAPER_H / 2
  {
    const l = Math.hypot(curl.ax, curl.az)
    curl.dx = curl.tdx = curl.ax / l
    curl.dz = curl.tdz = curl.az / l
  }
  const introCurl = solveCurl(0.55, 0.4, R_MIN, sMaxFor(curl.ax, curl.az, curl.dx, curl.dz))
  if (opts.shredded) {
    startShredMeshes()
    shredder!.position.z = CUT_Z - SHRED_DEPTH / 2
    setPanel('已粉碎', false)
    writeStrips(FEED_END)
    shredShot(true)
    view.snap = true
  } else if (opts.dropIn) {
    drop.active = true
    drop.h0 = view.base * 0.55
    setPaperPose(drop.h0, 0.3, 0.1, 0)
    ;(contact.material as THREE_NS.MeshBasicMaterial).opacity = 0
  } else {
    curl.s = introCurl.s
    curl.R = curl.tR = introCurl.R
  }
  if (!drop.active) markLanded()
  writeVertices()
  raf = requestAnimationFrame(frame)

  function redrawPaper() {
    stampAt = drawPaper(plainCanvas, cfg)
    if (!stampAnim) compose(stamped ? 1 : 0)
  }

  return {
    setConfig(next) {
      const prev = cfg
      cfg = next
      if (next.desk !== deskKey) {
        deskKey = next.desk
        deskTex.image = drawDesk(next.desk)
        deskTex.needsUpdate = true
      }
      if (next.style !== prev.style) backMat.color.set(PAPER_STYLES[next.style].base)
      redrawPaper()
    },
    redrawPaper,
    stamp() {
      if (stamped) return Promise.resolve()
      stamped = true
      return new Promise<void>((resolve) => {
        stampAnim = { t: 0, resolve }
      })
    },
    setStamped(on) {
      stamped = on
      if (!stampAnim) compose(on ? 1 : 0)
    },
    shred() {
      if (shredState.active || shredState.built) return Promise.resolve()
      endCurl()
      curl.s = curl.ts = 0
      curl.vel = 0
      writeVertices()
      startShredMeshes()
      writeStrips(0)
      shredShot()
      shredState.active = true
      shredState.t = 0
      shredState.f = 0
      return new Promise<void>((resolve) => {
        shredState.resolve = resolve
      })
    },
    whenLanded: () => landed,
    zoomBy(factor) {
      if (busy()) return
      zoomAt(factor, view.tcx, view.tcz)
    },
    resetView() {
      if (busy()) return
      view.tzoom = 1
      clampView()
    },
    snapshot() {
      // render and read back in the same task — no preserveDrawingBuffer needed
      renderer.render(scene, camera)
      return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('wheel', onWheel)
      ends.forEach((t) => canvas.removeEventListener(t, onUp))
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      canvas.remove()
    },
  }
}
