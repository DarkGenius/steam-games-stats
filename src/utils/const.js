/**
 * Константы приложения
 */

/**
 * Словарь соответствий названий игр между Steam и HowLongToBeat
 * Ключ - название игры в Steam
 * Значение - название игры в HowLongToBeat
 */
const GAME_NAME_MAP = {
    'Grand Theft Auto V Legacy': 'GTA V',
    'Epistory - Typing Chronicles': 'Epistory: Typing Chronicle',
    'Hard Truck: Apocalypse Rise Of Clans / Ex Machina: Meridian 113': 'Ex Machina: Meridian 113',
    'Never Alone (Kisima Ingitchuna)': 'Never Alone',
    'Jagged Alliance - Back in Action': 'Jagged Alliance: Back in Action',
    'Brothers - A Tale of Two Sons': 'Brothers: A Tale of Two Sons',
    'Talisman: Prologue': 'Talisman Prologue',
    'SpellForce 2 - Demons of the Past': 'SpellForce 2: Demons of the Past',
    'Savant - Ascent': 'Savant: Ascent',
    'Hard Truck Apocalypse / Ex Machina': 'Ex Machina',
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
    'Director\'s Cut',
    'Anniversary Edition',
    'Collector\'s Edition',
    'Ultimate Edition',
    'Legendary Edition',
    '[Enhanced Edition]',
    'Steam Edition',
    'E.Edition',
    '(Classic)',
    'Digital Classic Edition',
];

module.exports = {
    GAME_NAME_MAP,
    GAME_SUFFIXES
}; 