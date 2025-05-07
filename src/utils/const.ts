/**
 * Константы приложения
 */

/**
 * Словарь соответствий названий игр между Steam и HowLongToBeat
 * Ключ - название игры в Steam
 * Значение - название игры в HowLongToBeat
 */
export const GAME_NAME_MAP: Record<string, string> = {
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
    'Alien Rage - Unlimited': 'Alien Rage',
    'Braid, Anniversary Edition': 'Braid: Anniversary Edition',
    'Little Big Adventure - Twinsen\'s Quest Demo': 'Little Big Adventure: Twinsen\'s Quest Demo',
    'Desperados - Wanted Dead or Alive': 'Desperados: Wanted Dead or Alive',
    'Dark Messiah of Might & Magic Single Player': 'Dark Messiah of Might and Magic',
    'Broken Sword 2 - the Smoking Mirror: Remastered (2010)': 'Broken Sword II: The Smoking Mirror Remastered',
    'SEGA Mega Drive & Genesis Classics': 'SEGA Genesis Classics Collection',
    'F.E.A.R.: Extraction Point': 'F.E.A.R. Extraction Point',
    'F.E.A.R.: Perseus Mandate': 'F.E.A.R. Perseus Mandate',
    'Gothic 1 Classic': 'Gothic',
    'Galaxy on Fire 2™ Full HD': 'Galaxy on Fire 2 HD',
    'Anna - Extended Edition': 'Anna: Extended Edition',
};

/**
 * Массив популярных суффиксов названий игр
 * Используется для поиска базового названия игры без суффикса
 */
export const GAME_SUFFIXES: string[] = [
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
    'Steam Special Edition',
    'Legacy Edition',
]; 