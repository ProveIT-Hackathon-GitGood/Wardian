import type { Metadata } from 'next'
import { IBM_Plex_Sans, Roboto_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({ 
  subsets: ["latin"], 
  variable: "--font-ibm-plex",
  weight: ["300", "400", "500", "600", "700"]
});

const robotoMono = Roboto_Mono({ 
  subsets: ["latin"], 
  variable: "--font-roboto-mono",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: 'Wardian | Hospital Ward Management',
  description: 'Enterprise-grade hospital ward management and sepsis risk monitoring system',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} ${robotoMono.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
