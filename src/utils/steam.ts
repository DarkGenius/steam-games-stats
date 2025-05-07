import steamApi from '../api/steam';
import * as fs from 'fs/promises';
import { SteamGame } from '../types';

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
    const games = await steamApi.getOwnedGames(steamId);
    return [...games].sort((a, b) => b.playtime_forever - a.playtime_forever);
}

/**
 * Сохраняет список игр в файл
 * @param games - Список игр
 * @param steamId - Steam ID пользователя
 */
export async function saveGamesToFile(games: SteamGame[], steamId: string): Promise<void> {
    const filename = `games${steamId}.txt`;
    const content = games.map(game => {
        const playtimeHours = Math.round(game.playtime_forever / 60);
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
        const playtimeHours = Math.round(game.playtime_forever / 60);
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