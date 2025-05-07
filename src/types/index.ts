/**
 * Интерфейс для опций командной строки
 */
export interface CommandOptions {
  steamId?: string;
  howLong?: string;
  format?: 'json' | 'text' | 'excel';
  addHowLong?: boolean;
  updateCache?: boolean;
}

/**
 * Интерфейс для данных о времени прохождения
 */
export interface HowLongToBeat {
  title?: string;
  mainStory?: number;
  mainPlusExtras?: number;
  completionist?: number;
  remainingTime?: number;
}

/**
 * Интерфейс для игры Steam
 */
export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
  howLongToBeat?: HowLongToBeat;
}

/**
 * Интерфейс для кэша
 */
export interface CacheData {
  [key: string]: any;
} 