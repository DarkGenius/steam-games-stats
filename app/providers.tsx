'use client'

import { ThemeProvider, configure } from '@gravity-ui/uikit'
import { ReactNode, useEffect } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Configure Gravity UI once on client-side
    configure({
      lang: 'ru',
    })
  }, [])

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}
