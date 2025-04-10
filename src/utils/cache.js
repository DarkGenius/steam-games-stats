const fs = require('fs').promises;
const path = require('path');

/**
 * Класс для работы с кэшем
 */
class Cache {
    /**
     * @param {string} cacheFile - Путь к файлу кэша
     */
    constructor(cacheFile) {
        this.cacheFile = cacheFile;
        this.cache = {};
        this.initialized = false;
    }

    /**
     * Инициализация кэша
     */
    async init() {
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
                if (error.code === 'ENOENT') {
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
     * @param {string} cacheFile - Путь к файлу кэша
     * @returns {Promise<Cache>} Инициализированный экземпляр кэша
     * @throws {Error} Ошибка при инициализации кэша
     */
    static async create(cacheFile) {
        const cache = new Cache(cacheFile);
        await cache.init();
        return cache;
    }

    /**
     * Получить значение из кэша
     * @param {string} key - Ключ
     * @returns {Object|undefined} Значение из кэша или undefined, если значение не найдено
     */
    get(key) {
        return this.cache[key];
    }

    /**
     * Добавить значение в кэш
     * @param {string} key - Ключ
     * @param {Object} value - Значение
     */
    async add(key, value) {
        this.cache[key] = value;
        await this.save();
    }

    /**
     * Сохранить кэш в файл
     */
    async save() {
        try {
            await fs.writeFile(this.cacheFile, JSON.stringify(this.cache, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving cache:', error);
            throw error;
        }
    }
}

module.exports = Cache; 