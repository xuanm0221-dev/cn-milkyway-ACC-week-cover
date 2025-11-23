import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '재고주수 대시보드',
  description: '재고주수 히트맵 대시보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}



