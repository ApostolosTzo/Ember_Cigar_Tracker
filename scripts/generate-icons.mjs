/*
 * Generates the PWA icons (no dependencies, plain Node + zlib).
 * Run with: npm run icons
 * Outputs into public/icons/: icon-192.png, icon-512.png,
 * icon-maskable-512.png, apple-touch-icon.png
 */
import { deflateSync } from "node:zlib"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons")

/* ------------------------------ PNG codec ------------------------------ */

let crcTable = null
function getCrcTable() {
  if (crcTable) return crcTable
  crcTable = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crcTable[n] = c
  }
  return crcTable
}

function crc32(buf) {
  const table = getCrcTable()
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, "ascii"), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

/* ---------------------------- color helpers ---------------------------- */

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)

const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/* ------------------------------- palette ------------------------------- */

const BG_TOP = hex("#1d4a39")
const BG_BOTTOM = hex("#143125")
const WRAPPER_LIGHT = hex("#cf9760")
const WRAPPER_BASE = hex("#b07b4a")
const WRAPPER_DARK = hex("#7d5231")
const CHARRED = hex("#4a2a1d")
const EMBER_DARK = hex("#7a4030")
const EMBER_MID = hex("#e2622f")
const EMBER_HOT = hex("#ffb45e")
const EMBER_CORE = hex("#ffe9cd")
const GOLD = hex("#f4d9a2")
const HEAD = hex("#8a5a34")

/* ------------------------------ icon render ----------------------------- */

function renderIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4)
  const S = size / 512

  // Maskable icons keep the artwork inside the central 80% safe zone.
  const scale = maskable ? 0.62 : 1

  const cx = size / 2
  const cy = size / 2
  const L = 118 * S * scale // capsule half length
  const R = 34 * S * scale // capsule radius

  // Axis points up-right; the lit end (-L) lands at the lower left.
  const inv = Math.SQRT1_2
  const ux = inv
  const uy = -inv

  const emberLen = 58 * S * scale
  const emberStart = -L + emberLen // where wrapper turns to charred/ember
  const bandU = 0
  const bandHalf = 10 * S * scale
  const headStart = L - 26 * S * scale

  // Smoke puffs, in canvas space, drifting up-left from the lit tip.
  const tipX = cx - L * ux // lit tip sits at u = -L
  const tipY = cy - L * uy
  const nx = -inv
  const ny = -inv
  const puffs = [
    { x: tipX + nx * 62 * S, y: tipY + ny * 62 * S, r: 42 * S, a: 0.3 },
    { x: tipX + nx * 106 * S, y: tipY + ny * 106 * S - 14 * S, r: 34 * S, a: 0.2 },
    { x: tipX + nx * 148 * S, y: tipY + ny * 148 * S - 30 * S, r: 26 * S, a: 0.13 },
  ]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4

      // 1. background: vertical gradient
      const bgT = y / (size - 1)
      let [r, g, b] = mix(BG_TOP, BG_BOTTOM, bgT)

      // 2. smoke puffs (behind the cigar)
      for (const p of puffs) {
        const d = Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y)
        if (d < p.r) {
          const fall = 1 - (d / p.r) ** 2
          const a = p.a * fall
          r += (255 - r) * a
          g += (255 - g) * a
          b += (255 - b) * a
        }
      }

      // 3. cigar capsule
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const u = dx * ux + dy * uy
      const v = -dx * uy + dy * ux
      const uClamped = Math.max(-L, Math.min(L, u))
      const d = Math.hypot(u - uClamped, v)
      const alpha = smoothstep(R + 1, R - 1, d)

      if (alpha > 0) {
        const av = Math.min(1, Math.abs(v) / R)
        const shade = 1.16 - 0.48 * av ** 1.6

        // wrapper body with cylinder shading + faint leaf texture
        let body = mix(WRAPPER_LIGHT, WRAPPER_DARK, av ** 1.4)
        body = mix(body, WRAPPER_BASE, 0.35)
        const texture = 0.035 * Math.sin(u / (S * scale) * 0.55 + v / (S * scale) * 0.12)
        let cr = body[0] * shade * (1 + texture)
        let cg = body[1] * shade * (1 + texture)
        let cb = body[2] * shade * (1 + texture)

        // charred ring between wrapper and ember
        const ringDist = Math.abs(u - (emberStart + 8 * S * scale))
        const ring = 1 - smoothstep(0, 8 * S * scale, ringDist)
        if (ring > 0) {
          const charred = mix([cr, cg, cb], CHARRED, ring * 0.85)
          cr = charred[0]
          cg = charred[1]
          cb = charred[2]
        }

        // glowing ember toward the lit tip
        if (u < emberStart) {
          const t = clamp01((emberStart - u) / emberLen)
          let ember =
            t < 0.55
              ? mix(EMBER_DARK, EMBER_MID, t / 0.55)
              : mix(EMBER_MID, EMBER_HOT, (t - 0.55) / 0.45)
          const glowShade = Math.max(0.78, shade)
          ember = [ember[0] * glowShade, ember[1] * glowShade, ember[2] * glowShade]
          // white-hot core near the very tip
          if (t > 0.82 && av < 0.4) {
            const core = ((t - 0.82) / 0.18) * (1 - av / 0.4) * 0.8
            ember = mix(ember, EMBER_CORE, core)
          }
          cr = ember[0]
          cg = ember[1]
          cb = ember[2]
        }

        // closed head at the far end
        if (u > headStart) {
          const k = ((u - headStart) / (L - headStart)) * 0.75
          const head = mix([cr, cg, cb], HEAD, k)
          cr = head[0]
          cg = head[1]
          cb = head[2]
        }

        // gold band
        const bandEdge = 1 - smoothstep(bandHalf - 1.5 * S, bandHalf, Math.abs(u - bandU))
        if (bandEdge > 0) {
          let band = mix([cr, cg, cb], GOLD, bandEdge)
          const edgeDark = 1 - 0.25 * smoothstep(bandHalf - 3 * S, bandHalf - 1.5 * S, Math.abs(u - bandU))
          band = [band[0] * edgeDark, band[1] * edgeDark, band[2] * edgeDark]
          cr = band[0]
          cg = band[1]
          cb = band[2]
        }

        // subtle darker rim
        const rim = 1 - 0.3 * smoothstep(R - 2.4 * S, R - 0.6 * S, d)
        cr *= rim
        cg *= rim
        cb *= rim

        r += (cr - r) * alpha
        g += (cg - g) * alpha
        b += (cb - b) * alpha
      }

      rgba[i] = Math.max(0, Math.min(255, Math.round(r)))
      rgba[i + 1] = Math.max(0, Math.min(255, Math.round(g)))
      rgba[i + 2] = Math.max(0, Math.min(255, Math.round(b)))
      rgba[i + 3] = 255
    }
  }

  return encodePng(size, size, rgba)
}

/* -------------------------------- output -------------------------------- */

mkdirSync(outDir, { recursive: true })

const targets = [
  ["icon-192.png", 192, {}],
  ["icon-512.png", 512, {}],
  ["icon-maskable-512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, {}],
]

for (const [name, size, opts] of targets) {
  const file = join(outDir, name)
  writeFileSync(file, renderIcon(size, opts))
  console.log(`wrote ${file} (${size}x${size})`)
}
