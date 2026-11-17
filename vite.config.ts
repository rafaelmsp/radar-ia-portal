import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  base: '/radar-ia-portal/',
  plugins: [react(), VitePWA({
    registerType:'autoUpdate', includeAssets:['logo.svg','apple-touch-icon.png'],
    manifest: {
      name:'Radar IA & Direito', short_name:'Radar IA',
      description:'Monitoramento jurídico de inteligência artificial',
      theme_color:'#08182c', background_color:'#08182c',
      display:'standalone', start_url:'/radar-ia-portal/', scope:'/radar-ia-portal/',
      icons:[{src:'pwa-192.png',sizes:'192x192',type:'image/png'},
             {src:'pwa-512.png',sizes:'512x512',type:'image/png'},
             {src:'pwa-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]
    },
    workbox:{navigateFallback:'/radar-ia-portal/index.html',cleanupOutdatedCaches:true,
      runtimeCaching:[{urlPattern: /^https:\/\/kczjlvfrqzimlakuwele\.supabase\.co\/rest\/v1\/articles/,
       handler:'NetworkFirst',options:{cacheName:'radar-public-news',networkTimeoutSeconds:7,
         expiration:{maxEntries:30,maxAgeSeconds:60*60}}}]}
  })]
})
