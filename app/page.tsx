'use client'

import { Text, Container, Button } from '@gravity-ui/uikit'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <Container maxWidth="l" style={{ 
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1rem',
      gap: '2rem'
    }}>
      <Text variant="display-3">Steam Games Stats</Text>
      <Text variant="header-1" color="secondary">Анализ игрового времени</Text>
      
      <div style={{ marginTop: '2rem' }}>
        <Button view="action" size="xl" onClick={() => router.push('/analyze')}>
          Начать анализ
        </Button>
      </div>
      
      <Text variant="body-2" color="secondary" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        Используйте кнопку выше, чтобы начать анализ вашей игровой библиотеки Steam
      </Text>
    </Container>
  )
}
