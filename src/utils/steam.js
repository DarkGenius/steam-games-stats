const steamApi = require('../api/steam');
const fs = require('fs').promises;

/**
 * Проверяет, является ли строка числовым Steam ID
 * @param {string} str - Строка для проверки
 * @returns {boolean}
 */
function isNumericSteamId(str) {
    return /^\d+$/.test(str);
}

/**
 * Получает Steam ID из имени аккаунта или числового ID
 * @param {string} steamIdOrVanityUrl - Steam ID или имя аккаунта
 * @returns {Promise<string>} Steam ID
 */
async function getSteamId(steamIdOrVanityUrl) {
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
        console.error(`Error resolving vanity URL: ${error.message}`);
        throw error;
    }
}

/**
 * Получает и сортирует список игр пользователя Steam
 * @param {string} steamIdOrVanityUrl - Steam ID или имя аккаунта
 * @returns {Promise<Array>} Отсортированный список игр
 */
async function getAndSortGames(steamIdOrVanityUrl) {
    const steamId = await getSteamId(steamIdOrVanityUrl);
    const games = await steamApi.getOwnedGames(steamId);
    return [...games].sort((a, b) => b.playtime_forever - a.playtime_forever);
}

/**
 * Сохраняет список игр в файл
 * @param {Array} games - Список игр
 * @param {string} steamId - Steam ID пользователя
 * @returns {Promise<void>}
 */
async function saveGamesToFile(games, steamId) {
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
 * @param {Array} games - Отсортированный список игр
 * @param {number} count - Количество игр для вывода
 */
function displayTopGames(games, count = 10) {
    console.log(`\nTop ${count} games by playtime:`);
    games.slice(0, count).forEach((game, index) => {
        const playtimeHours = Math.round(game.playtime_forever / 60);
        console.log(`${index + 1}. ${game.name} (Playtime: ${playtimeHours} hours)`);
    });
}

/**
 * Проверяет валидность Steam ID или имени аккаунта
 * @param {string} steamIdOrVanityUrl - Steam ID или имя аккаунта для проверки
 * @returns {boolean}
 */
function isValidSteamId(steamIdOrVanityUrl) {
    return steamIdOrVanityUrl && steamIdOrVanityUrl.length > 0;
}

module.exports = {
    getAndSortGames,
    saveGamesToFile,
    displayTopGames,
    isValidSteamId,
    getSteamId
}; 