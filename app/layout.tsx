import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Steam Games Stats | Анализ игрового времени',
  description: 'Анализ вашей игровой библиотеки Steam с интеграцией HowLongToBeat',
  keywords: ['Steam', 'игры', 'статистика', 'HowLongToBeat', 'анализ игрового времени'],
  authors: [{ name: 'DarkGenius' }],
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1d1d1d' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
        <Providers>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
