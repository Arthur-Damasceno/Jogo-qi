// Gera os PNGs do PWA a partir de public/favicon.svg
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const src = 'public/favicon.svg'
mkdirSync('public/icons', { recursive: true })

for (const size of [192, 512]) {
  await sharp(src).resize(size, size).png().toFile(`public/icons/icon-${size}.png`)
}

// Ícone maskable: mesma arte com margem de segurança (zona segura de 80%)
const inner = await sharp(src).resize(410, 410).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#0f1420' },
})
  .composite([{ input: inner, left: 51, top: 51 }])
  .png()
  .toFile('public/icons/icon-maskable-512.png')

console.log('Ícones gerados em public/icons/')
