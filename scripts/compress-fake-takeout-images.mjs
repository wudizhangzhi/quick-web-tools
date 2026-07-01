#!/usr/bin/env node
/**
 * Compress raw dish images and update shops.json.
 *
 * Usage:
 *   node scripts/compress-fake-takeout-images.mjs [rawDir]
 *
 * Expects raw files named <dishId>.png|.jpg|.jpeg in rawDir (default: tmp/ft-raw).
 * Outputs 256x256 webp to public/fake-takeout/<dishId>.webp and patches dish.image.
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const rawDir = path.resolve(root, process.argv[2] ?? 'tmp/ft-raw')
const outDir = path.resolve(root, 'public/fake-takeout')
const shopsPath = path.resolve(root, 'lib/fake-takeout/shops.json')

if (!fs.existsSync(rawDir)) {
  console.error(`Raw dir not found: ${rawDir}`)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const exts = ['.png', '.jpg', '.jpeg', '.webp']
const rawFiles = fs.readdirSync(rawDir).filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))

if (rawFiles.length === 0) {
  console.log('No raw images found.')
  process.exit(0)
}

const shops = JSON.parse(fs.readFileSync(shopsPath, 'utf8'))
const dishById = new Map()
const shopById = new Map()
for (const shop of shops) {
  shopById.set(shop.id, shop)
  for (const dish of shop.dishes) {
    dishById.set(dish.id, dish)
  }
}

let compressed = 0
let dishUpdated = 0
let shopUpdated = 0
const missing = []

for (const file of rawFiles) {
  const ext = path.extname(file)
  const baseName = path.basename(file, ext)
  const src = path.join(rawDir, file)
  const dest = path.join(outDir, `${baseName}.webp`)

  try {
    execSync(
      `ffmpeg -y -i "${src}" -vf "scale=256:256:force_original_aspect_ratio=increase,crop=256:256" -c:v libwebp -quality 75 "${dest}"`,
      { stdio: 'pipe' },
    )
    compressed++
    const size = fs.statSync(dest).size
    console.log(`✓ ${baseName}.webp (${(size / 1024).toFixed(1)} KB)`)

    if (baseName.startsWith('shop-')) {
      const shopId = baseName.slice('shop-'.length)
      const shop = shopById.get(shopId)
      if (shop) {
        shop.logoImage = `/fake-takeout/${baseName}.webp`
        shopUpdated++
      } else {
        missing.push(baseName)
      }
    } else {
      const dish = dishById.get(baseName)
      if (dish) {
        dish.image = `/fake-takeout/${baseName}.webp`
        dishUpdated++
      } else {
        missing.push(baseName)
      }
    }
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`)
  }
}

if (dishUpdated > 0 || shopUpdated > 0) {
  fs.writeFileSync(shopsPath, JSON.stringify(shops, null, 2) + '\n')
}

console.log(`\nCompressed: ${compressed}, dishes: ${dishUpdated}, shop logos: ${shopUpdated}`)
if (missing.length) {
  console.warn('No matching dish id:', missing.join(', '))
}