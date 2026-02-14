import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Enregistrement du Service Worker PWA
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Notification à l'utilisateur qu'une mise à jour est disponible
    if (confirm('Une nouvelle version est disponible. Voulez-vous mettre à jour?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('✅ Application prête pour fonctionner hors ligne')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
