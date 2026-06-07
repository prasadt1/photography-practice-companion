import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FirebaseAuthProvider } from './auth/FirebaseAuthProvider.tsx'
import { ToastHost } from './components/ToastHost'
import { initTheme } from './lib/theme'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseAuthProvider>
      <ToastHost>
        <App />
      </ToastHost>
    </FirebaseAuthProvider>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* optional PWA shell */
    })
  })
}
