import * as fs from 'fs/promises';
import { SteamGame } from '../types';
import axios from 'axios';
import { mockSteamGames } from './mock';

/**
 * Проверяет, является ли строка числовым Steam ID
 * @param str - Строка для проверки
 * @returns true если строка является числовым Steam ID
 */
function isNumericSteamId(str: string): boolean {
  return /^\d+$/.test(str);
}

/**
 * Получает Steam ID из имени аккаунта или числового ID
 * @param steamIdOrVanityUrl - Steam ID или имя аккаунта
 * @returns Steam ID
 */
export async function getSteamId(steamIdOrVanityUrl: string): Promise<string> {
  if (isNumericSteamId(steamIdOrVanityUrl)) {
    return steamIdOrVanityUrl;
  }

  try {
    const steamApi = (await import('../api/steam')).default;
    const steamId = await steamApi.getSteamId(steamIdOrVanityUrl);
    if (!steamId) {
      throw new Error(`Could not find Steam ID for vanity URL: ${steamIdOrVanityUrl}`);
    }
    return steamId;
  } catch (error) {
    console.error(`Error resolving vanity URL: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Получает и сортирует список игр пользователя Steam
 * @param steamIdOrVanityUrl - Steam ID или имя аккаунта
 * @returns Отсортированный список игр
 */
export async function getAndSortGames(steamIdOrVanityUrl: string): Promise<SteamGame[]> {
  const steamId = await getSteamId(steamIdOrVanityUrl);
  const steamApi = (await import('../api/steam')).default;
  const games = await steamApi.getOwnedGames(steamId);
  return [...games].sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0));
}

/**
 * Сохраняет список игр в файл
 * @param games - Список игр
 * @param steamId - Steam ID пользователя
 */
export async function saveGamesToFile(games: SteamGame[], steamId: string): Promise<void> {
  const filename = `games${steamId}.txt`;
  const content = games.map(game => {
    const playtimeHours = Math.round((game.playtime_forever ?? 0) / 60);
    return `${game.name} (Playtime: ${playtimeHours} hours)`;
  }).join('\n');

  await fs.writeFile(filename, content, 'utf8');
  console.log(`Games list saved to ${filename}`);
}

/**
 * Выводит топ N игр по времени игры
 * @param games - Отсортированный список игр
 * @param count - Количество игр для вывода
 */
export function displayTopGames(games: SteamGame[], count = 10): void {
  console.log(`\nTop ${count} games by playtime:`);
  games.slice(0, count).forEach((game, index) => {
    const playtimeHours = Math.round((game.playtime_forever ?? 0) / 60);
    console.log(`${index + 1}. ${game.name} (Playtime: ${playtimeHours} hours)`);
  });
}

/**
 * Проверяет валидность Steam ID или имени аккаунта
 * @param steamIdOrVanityUrl - Steam ID или имя аккаунта для проверки
 * @returns true если Steam ID или имя аккаунта валидны
 */
export function isValidSteamId(steamIdOrVanityUrl: string): boolean {
  return Boolean(steamIdOrVanityUrl && steamIdOrVanityUrl.length > 0);
}

export async function getSteamGames(steamIdOrVanity: string): Promise<SteamGame[]> {
  try {
    // Проверяем, является ли это тестовым пользователем
    if (mockSteamGames[steamIdOrVanity.toLowerCase()]) {
      console.log('Using mock data for', steamIdOrVanity);
      return mockSteamGames[steamIdOrVanity.toLowerCase()];
    }

    // Получаем числовой Steam ID (работает и для vanity, и для числового)
    const steamId = await getSteamId(steamIdOrVanity);

    // Получаем профиль
    const profileResponse = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
    );

    if (!profileResponse.data.response.players.length) {
      throw new Error('Steam profile not found');
    }

    // Получаем список игр
    const gamesResponse = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`
    );

    const games = gamesResponse.data.response.games || [];

    // Трансформируем данные
    return games.map((game: any) => ({
      name: game.name,
      playtime: Math.round(game.playtime_forever / 60),
      hltb: null,
      playtime_forever: game.playtime_forever
    }));
  } catch (error) {
    console.error('Error fetching Steam data:', error);
    throw error;
  }
}