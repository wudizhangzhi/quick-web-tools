#!/usr/bin/env node
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = path.resolve(root, 'tmp/ft-raw')
const outDir = path.resolve(root, 'public/fake-takeout')
const shopsPath = path.resolve(root, 'lib/fake-takeout/shops.json')

const shops = JSON.parse(fs.readFileSync(shopsPath, 'utf8'))
const shopById = new Map(shops.map((s) => [s.id, s]))
let updated = 0

for (const file of fs.readdirSync(rawDir).filter((f) => f.startsWith('shop-') && /\.jpe?g$/i.test(f))) {
  const base = file.replace(/\.[^.]+$/, '')
  const shopId = base.slice('shop-'.length)
  const src = path.join(rawDir, file)
  const dest = path.join(outDir, `${base}.webp`)

  execSync(
    `ffmpeg -y -i "${src}" -vf "scale=256:256:force_original_aspect_ratio=increase,crop=256:256" -c:v libwebp -quality 75 "${dest}"`,
    { stdio: 'pipe' },
  )

  const shop = shopById.get(shopId)
  if (shop) {
    shop.logoImage = `/fake-takeout/${base}.webp`
    updated++
    console.log(`✓ ${base}.webp (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`)
  }
}

fs.writeFileSync(shopsPath, JSON.stringify(shops, null, 2) + '\n')
console.log(`Updated ${updated} shop logos in shops.json`)