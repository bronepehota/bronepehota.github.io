import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import { Russo_One, IBM_Plex_Mono, Oswald } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900'],
})

// Military-themed fonts
const russoOne = Russo_One({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-russo',
  weight: '400',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-ibm-mono',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const oswald = Oswald({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-oswald',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Бронепехота - Помощник',
  description: 'Приложение для игры в варгейм Бронепехота',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`${orbitron.variable} ${russoOne.variable} ${ibmPlexMono.variable} ${oswald.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}


