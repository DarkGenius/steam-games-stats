'use client';

import { useState } from 'react';
import { Button, TextInput, Flex, Container, Text, Card } from '@gravity-ui/uikit';
import { useRouter } from 'next/navigation';
import { Logo } from '../components/Logo';

export default function Home() {
  const [steamId, setSteamId] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!steamId.trim()) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/analysis/${steamId}`);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSteamId(e.target.value);
    if (error && e.target.value.trim()) {
      setError(false);
    }
  };

  return (
    <Container maxWidth="l" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Flex direction="column" alignItems="center" style={{ marginTop: '48px' }}>
        <Logo size={72} />
        <Text variant="display-2" style={{ fontWeight: 700, textAlign: 'center', marginTop: 24 }}>
          Steam Games Analysis
        </Text>
        <Text variant="body-1" color="secondary" style={{ marginTop: 16, maxWidth: 520, textAlign: 'center' }}>
          Введите ваш Steam ID или имя аккаунта, чтобы получить подробную статистику по вашим играм
        </Text>

        <Card
          style={{
            marginTop: 40,
            padding: 32,
            boxShadow: '0 4px 24px 0 rgba(0,0,0,0.04)',
            borderRadius: 16,
            minWidth: 420,
            maxWidth: 600,
            width: '100%',
          }}
        >
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Flex gap={2} alignItems="center">
              <TextInput
                size="l"
                placeholder="Введите Steam ID или имя аккаунта"
                value={steamId}
                onChange={handleInput}
                style={{ flex: 1 }}
                error={error}
                errorMessage={error ? 'Пожалуйста, введите Steam ID или имя аккаунта' : undefined}
              />
              <Button
                view="action"
                size="l"
                type="submit"
              >
                Начать анализ
              </Button>
            </Flex>
          </form>
        </Card>

        <Text variant="body-2" color="secondary" style={{ marginTop: 32, textAlign: 'center' }}>
          Не знаете свой Steam ID? Найти его можно в настройках профиля Steam
        </Text>
      </Flex>
    </Container>
  );
} 