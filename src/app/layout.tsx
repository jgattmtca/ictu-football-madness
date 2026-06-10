import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ICTU Football Madness',
  description: 'The ultimate football prediction competition',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
