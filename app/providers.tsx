'use client'

import { ThemeProvider, configure } from '@gravity-ui/uikit'
import '@gravity-ui/uikit/styles/fonts.css'
import '@gravity-ui/uikit/styles/styles.css'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  configure({
    lang: 'ru',
  })

  return <ThemeProvider>{children}</ThemeProvider>
}
