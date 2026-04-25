import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register' // service worker for PWA

// Register the service worker
registerSW({
  onRegistered(r) {
    console.log("Service Worker registered!", r)
  },
  onRegisterError(err) {
    console.error("SW registration failed:", err)
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)