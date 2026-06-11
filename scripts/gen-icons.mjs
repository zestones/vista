// Generates the PWA PNG icons from the icon.svg geometry (#235). Pure Node (zlib only) so no image
// dependency is needed. Run: `node scripts/gen-icons.mjs`. Outputs to public/.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [0x18, 0x1d, 0x26]
const BARS = [
  { x: 120, y: 170, w: 272, h: 48, r: 24, c: [0xfc, 0xab, 0x79] },
  { x: 120, y: 244, w: 200, h: 48, r: 24, c: [0xa8, 0xd8, 0xc4] },
  { x: 120, y: 318, w: 128, h: 48, r: 24, c: [0xf4, 0xd3, 0x5e] },
]
const BG_RADIUS = 112 // rounded-rect corners for the "any" icons; maskable/apple use a full square

const insideRR = (px, py, x, y, w, h, r) => {
  if (px < x || py < y || px > x + w || py > y + h) return false
  const rx = Math.min(r, w / 2)
  const ry = Math.min(r, h / 2)
  const dxl = x + rx
  const dxr = x + w - rx
  const dyt = y + ry
  const dyb = y + h - ry
  let cx = px
  let cy = py
  if (px < dxl && py < dyt) [cx, cy] = [dxl, dyt]
  else if (px > dxr && py < dyt) [cx, cy] = [dxr, dyt]
  else if (px < dxl && py > dyb) [cx, cy] = [dxl, dyb]
  else if (px > dxr && py > dyb) [cx, cy] = [dxr, dyb]
  else return true
  const nx = (px - cx) / rx
  const ny = (py - cy) / ry
  return nx * nx + ny * ny <= 1
}

const colorAt = (px, py, maskable) => {
  for (const b of BARS) if (insideRR(px, py, b.x, b.y, b.w, b.h, b.r)) return [...b.c, 255]
  if (insideRR(px, py, 0, 0, 512, 512, maskable ? 0 : BG_RADIUS)) return [...BG, 255]
  return [0, 0, 0, 0]
}

const render = (size, maskable) => {
  const SS = 4
  const n = SS * SS
  const scale = 512 / size
  const data = Buffer.alloc(size * size * 4)
  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = colorAt((ox + (sx + 0.5) / SS) * scale, (oy + (sy + 0.5) / SS) * scale, maskable)
          const af = c[3] / 255
          r += c[0] * af
          g += c[1] * af
          b += c[2] * af
          a += c[3]
        }
      }
      const aAvg = a / n
      const idx = (oy * size + ox) * 4
      if (aAvg <= 0) continue
      const af = aAvg / 255
      data[idx] = Math.round(r / n / af)
      data[idx + 1] = Math.round(g / n / af)
      data[idx + 2] = Math.round(b / n / af)
      data[idx + 3] = Math.round(aAvg)
    }
  }
  return data
}

// --- minimal PNG (RGBA, 8-bit) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
const encodePNG = (size, rgba) => {
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

const write = (name, size, maskable) => {
  writeFileSync(join(OUT, name), encodePNG(size, render(size, maskable)))
  console.log('wrote', name)
}

write('icon-192.png', 192, false)
write('icon-512.png', 512, false)
write('icon-maskable-512.png', 512, true)
write('apple-touch-icon.png', 180, true)
