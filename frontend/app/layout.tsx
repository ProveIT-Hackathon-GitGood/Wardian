import type { Metadata } from 'next'
import { IBM_Plex_Sans, Roboto_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
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
    icon: '/wardian-logo.png',
    apple: '/wardian-logo.png',
  },
  openGraph: {
    title: 'Wardian | Hospital Ward Management',
    description: 'Enterprise-grade hospital ward management and sepsis risk monitoring system',
    images: [{ url: '/wardian-logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wardian | Hospital Ward Management',
    description: 'Enterprise-grade hospital ward management and sepsis risk monitoring system',
    images: ['/wardian-logo.png'],
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
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
