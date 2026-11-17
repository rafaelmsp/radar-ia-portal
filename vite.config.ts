import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Conteúdo autenticado não deve entrar no Cache Storage do Service Worker.
// O PWA mantém apenas o shell estático para abertura offline.
export default defineConfig({
  base: '/radar-ia-portal/',
  plugins: [react(), VitePWA({
    registerType:'autoUpdate',
    includeAssets:['logo.svg','apple-touch-icon.png'],
    manifest:{
      name:'Radar IA & Direito',
      short_name:'Radar IA',
      description:'Inteligência jurídica com fontes verificáveis e ferramentas práticas',
      theme_color:'#0d2934',
      background_color:'#f7f7f4',
      display:'standalone',
      start_url:'/radar-ia-portal/',
      scope:'/radar-ia-portal/',
      icons:[
        {src:'pwa-192.png',sizes:'192x192',type:'image/png'},
        {src:'pwa-512.png',sizes:'512x512',type:'image/png'},
        {src:'pwa-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
      ]
    },
    workbox:{
      navigateFallback:'/radar-ia-portal/index.html',
      cleanupOutdatedCaches:true,
      runtimeCaching:[]
    }
  })],
  build:{
    rollupOptions:{
      output:{manualChunks:{'vendor-react':['react','react-dom'],'vendor-supabase':['@supabase/supabase-js']}}
    }
  }
})
