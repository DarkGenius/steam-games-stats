import * as fs from 'fs/promises';
import * as path from 'path';
import { CacheData } from '../types';

/**
 * Класс для работы с кэшем
 */
export class Cache {
    private cacheFile: string;
    private cache: CacheData;
    private initialized: boolean;

    /**
     * @param cacheFile - Путь к файлу кэша
     */
    constructor(cacheFile: string) {
        this.cacheFile = cacheFile;
        this.cache = {};
        this.initialized = false;
    }

    /**
     * Инициализация кэша
     */
    async init(): Promise<void> {
        if (this.initialized) return;
        try {
            // Создаем директорию для кэша, если её нет
            const cacheDir = path.dirname(this.cacheFile);
            await fs.mkdir(cacheDir, { recursive: true });

            // Пытаемся прочитать существующий файл кэша
            try {
                const data = await fs.readFile(this.cacheFile, 'utf8');
                this.cache = JSON.parse(data);
                this.initialized = true;
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    // Если файл не существует, создаем его с пустым объектом
                    await fs.writeFile(this.cacheFile, '{}', 'utf8');
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error initializing cache:', error);
            throw error;
        }
    }

    /**
     * Создает и инициализирует новый экземпляр кэша
     * @param cacheFile - Путь к файлу кэша
     * @returns Инициализированный экземпляр кэша
     * @throws {Error} Ошибка при инициализации кэша
     */
    static async create(cacheFile: string): Promise<Cache> {
        const cache = new Cache(cacheFile);
        await cache.init();
        return cache;
    }

    /**
     * Получить значение из кэша
     * @param key - Ключ
     * @returns Значение из кэша или undefined, если значение не найдено
     */
    get(key: string): any {
        return this.cache[key];
    }

    /**
     * Добавить значение в кэш
     * @param key - Ключ
     * @param value - Значение
     */
    async add(key: string, value: any): Promise<void> {
        this.cache[key] = value;
        await this.save();
    }

    /**
     * Сохранить кэш в файл
     */
    async save(): Promise<void> {
        try {
            await fs.writeFile(this.cacheFile, JSON.stringify(this.cache, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving cache:', error);
            throw error;
        }
    }
} 