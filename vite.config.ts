import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Servido em produção via GitHub Pages: https://arthur-damasceno.github.io/Jogo-qi/
export default defineConfig({
  base: '/Jogo-qi/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Jogo QI — Treino Cerebral',
        short_name: 'Jogo QI',
        description:
          'Jogos de raciocínio crítico, lógica, memória e matemática em português para treinar o cérebro.',
        lang: 'pt-BR',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0f1420',
        background_color: '#0f1420',
        start_url: '/Jogo-qi/',
        scope: '/Jogo-qi/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
