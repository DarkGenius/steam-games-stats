/**
 * Константы приложения
 */

/**
 * Словарь соответствий названий игр между Steam и HowLongToBeat
 * Ключ - название игры в Steam
 * Значение - название игры в HowLongToBeat
 */
const GAME_NAME_MAP = {
    'Grand Theft Auto V Legacy': 'GTA V'
};

/**
 * Массив популярных суффиксов названий игр
 * Используется для поиска базового названия игры без суффикса
 */
const GAME_SUFFIXES = [
    'Enhanced Edition',
    'Definitive Edition',
    'Remastered',
    'Remaster',
    'Complete Edition',
    'Game of the Year Edition',
    'GOTY Edition',
    'Deluxe Edition',
    'Ultimate Edition',
    'Director\'s Cut'
];

module.exports = {
    GAME_NAME_MAP,
    GAME_SUFFIXES
}; 