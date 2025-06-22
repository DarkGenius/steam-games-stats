'use client';

import { useEffect, useState, useRef } from 'react';
import { Table, Loader, Alert, Card, Flex, Text, Progress } from '@gravity-ui/uikit';
import { useParams } from 'next/navigation';

interface HLTBData {
  title?: string;
  mainStory?: number;
  mainPlusExtras?: number;
  completionist?: number;
}

interface GameData {
  name: string;
  playtime: number;
  playtime_forever?: number;
  hltb?: HLTBData | null;
}

export default function AnalysisPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GameData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const initialGamesWithoutHltbRef = useRef<number | null>(null);
  const isInitialFetch = useRef(true);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const isTestUser = params?.steamId === 'testuser';

    const fetchData = async () => {
      if (!params?.steamId) {
        setError('Steam ID is required');
        setLoading(false);
        return;
      }

      const url = new URL(`${window.location.origin}/api/steam/${params.steamId}`);
      if (isTestUser && isInitialFetch.current) {
        url.searchParams.append('no_cache', 'true');
        isInitialFetch.current = false;
      }

      try {
        const response = await fetch(url.toString());
        if (response.status === 429) {
          const result = await response.json();
          setError(result.error || 'Слишком много запросов к Steam API. Попробуйте позже.');
          setLoading(false);
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
        
        const gamesWithoutHltbCount = result.filter((g: GameData) => !g.hltb).length;

        if (initialGamesWithoutHltbRef.current === null) {
          initialGamesWithoutHltbRef.current = gamesWithoutHltbCount;
        }

        const initialCount = initialGamesWithoutHltbRef.current;
        if (initialCount !== null && initialCount > 0) {
          const fetchedCount = initialCount - gamesWithoutHltbCount;
          const newProgress = Math.round((fetchedCount / initialCount) * 100);
          setProgress(newProgress);
        }

        const hasIncompleteData = gamesWithoutHltbCount > 0;
        
        // Если данных больше нет, останавливаем polling
        if (!hasIncompleteData && interval) {
          clearInterval(interval);
          interval = null;
        }
        // Если есть неполные данные и polling еще не запущен, запускаем его
        else if (hasIncompleteData && !interval) {
          interval = setInterval(fetchData, 4000); // polling каждые 4 секунды
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [params?.steamId]);

  const columns = [
    { id: 'name', name: 'Название игры' },
    { id: 'playtime', name: 'Время в игре (часы)', template: (item: GameData) => item.playtime?.toFixed(2) ?? '0' },
    {
      id: 'mainStory',
      name: 'Main Story (ч)',
      template: (item: GameData) => {
        if (!item.hltb) return <Loader size="s" />;
        const value = item.hltb.mainStory;
        if (value === undefined || value === null) return <Loader size="s" />;
        return typeof value === 'number' ? value.toFixed(2) : String(value);
      },
    },
    {
      id: 'mainPlusExtras',
      name: 'Main + Extras (ч)',
      template: (item: GameData) => {
        if (!item.hltb) return <Loader size="s" />;
        const value = item.hltb.mainPlusExtras;
        if (value === undefined || value === null) return <Loader size="s" />;
        return typeof value === 'number' ? value.toFixed(2) : String(value);
      },
    },
    {
      id: 'completionist',
      name: 'Completionist (ч)',
      template: (item: GameData) => {
        if (!item.hltb) return <Loader size="s" />;
        const value = item.hltb.completionist;
        if (value === undefined || value === null) return <Loader size="s" />;
        return typeof value === 'number' ? value.toFixed(2) : String(value);
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="l" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert title="Ошибка" message={error} theme="danger" />
      </div>
    );
  }

  return (
    <Flex direction="column" alignItems="center" style={{ minHeight: '100vh', background: '#fafbfc', padding: 32 }}>
      <Card style={{ maxWidth: 1100, width: '100%', padding: 32, marginTop: 32 }}>
        <Text variant="display-2" style={{ fontWeight: 700, marginBottom: 24 }}>
          Steam Games Analysis
        </Text>
        {progress !== null && progress < 100 && (
            <div style={{margin: '24px 0'}}>
                <Progress value={progress} text={`${progress}%`} size="m" />
                <Text variant="body-2" color="secondary" style={{marginTop: '8px', textAlign: 'center'}}>
                  Загрузка данных с HowLongToBeat...
                </Text>
            </div>
        )}
        <Table
          data={data}
          columns={columns}
          getRowId={(row) => row.name}
        />
      </Card>
    </Flex>
  );
} 