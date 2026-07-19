import type { Metadata, Viewport } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import { Russo_One, IBM_Plex_Mono, Oswald } from 'next/font/google'
import './globals.css'
import { SerwistRegister } from '@/components/SerwistRegister'
import NavigationProgress from '@/components/NavigationProgress'
import { BASE_PATH, SITE_URL } from '@/lib/constants'
import { absoluteUrl } from '@/lib/seo'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import YandexMetrica from '@/components/YandexMetrica'

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

const SITE_NAME = 'Бронепехота';
// Fully-absolute default social card — a 1200×630 screenshot of the landing hero
// (regenerate via /tmp/shot-hero.mjs + /tmp/crop-og.py when the landing changes).
const OG_IMAGE = absoluteUrl('/og-image.png');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Бронепехота — настольный варгейм: энциклопедия, фракции, миссии, калькулятор боя',
  description:
    'Бронепехота — бесплатный помощник для настольного варгейма: полная энциклопедия отрядов и техники фракций (Полярис, Протекторат, Наёмники, Рутения), лор, миссии, кампании и калькулятор боя.',
  applicationName: SITE_NAME,
  keywords: [
    'бронепехота',
    'настольная игра',
    'варгейм',
    'настольный варгейм',
    'robogear',
    'звёздная система',
    'энциклопедия бронепехота',
    'правила бронепехота',
    'фракции',
    'полярис',
    'протекторат',
    'наёмники',
    'рутения',
    'миссии',
    'кампании',
    'калькулятор боя',
    'отряды',
    'техника',
  ],
  manifest: `${BASE_PATH}/manifest.json`,
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: absoluteUrl('/'),
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Бронепехота — настольный варгейм',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Бронепехота — настольный варгейм',
    description:
      'Энциклопедия отрядов и техники, фракции, лор, миссии, кампании и калькулятор боя.',
    images: [OG_IMAGE],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icons/icon-192x192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE_PATH}/icons/icon-512x512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: `${BASE_PATH}/icons/icon-152x152.png`, sizes: "152x152", type: "image/png" },
    ],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`${orbitron.variable} ${russoOne.variable} ${ibmPlexMono.variable} ${oswald.variable}`}>
      <body className={inter.className}>
        <GoogleAnalytics />
        <YandexMetrica />
        <SerwistRegister />
        <NavigationProgress />
        {children}
      </body>
    </html>
  )
}


