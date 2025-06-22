import { NextResponse } from 'next/server';
import { getSteamGames } from '../../../../utils/steam';
import axios from 'axios';
import { getGameCompletionTime } from '../../../../api/hltb';
import pLimit from 'p-limit';

// Глобальный лимит на количество одновременных браузеров
const MAX_CONCURRENT_REQUESTS = 2;
const limit = pLimit(MAX_CONCURRENT_REQUESTS);

export async function GET(
  request: Request,
  { params }: { params: { steamId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const noCache = searchParams.get('no_cache') === 'true';
    const isTestUser = params.steamId.toLowerCase() === 'testuser';

    const games = await getSteamGames(params.steamId);

    // Получаем HLTB только из кэша (быстро)
    const gamesWithHLTB = await Promise.all(
      games.map(async (game) => {
        const hltb = await getGameCompletionTime(game.name, null, false); // только кэш

        // Для testuser при первом запросе hltb будет null, чтобы запустить поллинг
        const effectiveHltb = (isTestUser && noCache) ? null : hltb;

        // Если данных нет (или мы их проигнорировали), запускаем асинхронную подгрузку (fire-and-forget)
        if (!effectiveHltb) {
          limit(() => getGameCompletionTime(game.name, null, true)).catch(() => { });
        }
        return {
          ...game,
          hltb: effectiveHltb,
        };
      })
    );

    // Сортировка по времени
    gamesWithHLTB.sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0));

    return NextResponse.json(gamesWithHLTB);
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Слишком много запросов к Steam API. Попробуйте позже.' },
        { status: 429 }
      );
    }
    console.error('Error fetching Steam games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Steam games' },
      { status: 500 }
    );
  }
} 