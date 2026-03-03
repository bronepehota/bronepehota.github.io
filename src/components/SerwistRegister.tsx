'use client'

import { useEffect } from 'react'

export function SerwistRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Determine the base path from window.location
      // For GitHub Pages: https://username.github.io/bronepehota/
      // The basePath is '/bronepehota' in production
      const basePath = window.location.pathname.startsWith('/bronepehota')
        ? '/bronepehota'
        : ''

      // Register the service worker with the correct path
      navigator.serviceWorker
        .register(`${basePath}/sw.js`, { scope: basePath ? `${basePath}/` : '/' })
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  return null
}
