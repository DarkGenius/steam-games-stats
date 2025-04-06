const { createBrowser, preparePage, closeBrowser, getPreparedPage } = require('../utils/browser');
const { GAME_NAME_MAP, GAME_SUFFIXES } = require('../utils/const');
const Cache = require('../utils/cache');
const path = require('path');

const CARD_ITEM_SELECTOR = '#search-results-header > ul > li';
const MAX_WAIT_SELECTOR_TIMEOUT = 10000; // 10 секунд в миллисекундах
const CACHE_FILE = path.join(__dirname, '../../data/hltb_cache.json');

// Создаем экземпляр кэша
let _cache = null;
async function getCache() {
    if (!_cache) {
        _cache = await Cache.create(CACHE_FILE);
    }
    return _cache;
}

/**
 * Очищает название игры от суффиксов и специальных символов в конце
 * @param {string} gameName - Исходное название игры
 * @param {string} mode - Режим очистки: 'full' (полная очистка), 'symbols' (только символы), 'suffixes' (только суффиксы), 'none' (без очистки)
 * @returns {string} Очищенное название игры
 */
function cleanGameName(gameName, mode = 'full') {
    let cleanedName = gameName;
    
    // Режим без очистки
    if (mode === 'none') {
        return cleanedName;
    }

    cleanedName = gameName.trim();
    
    // Режим очистки только от суффиксов
    if (mode === 'suffixes' || mode === 'full') {
        for (const suffix of GAME_SUFFIXES) {
            if (cleanedName.endsWith(suffix)) {
                cleanedName = cleanedName.slice(0, -suffix.length).trim();
            }
        }
    }
    
    // Режим очистки только от специальных символов
    if (mode === 'symbols' || mode === 'full') {
        // Удаляем специальные символы в конце
        cleanedName = cleanedName.replace(/[-:—]\s*$/, '').trim();
        
        // Удаляем символы товарных знаков и другие специальные символы
        cleanedName = cleanedName.replace(/[®™©℠℗]/g, '').trim();
    }
    
    return cleanedName;
}

/**
 * Извлекает данные о времени прохождения игры из результатов поиска
 * @param {Object} page - Страница Puppeteer
 * @returns {Promise<Object|null>} Данные о времени прохождения или null, если данные не найдены
 */
async function extractGameCompletionData(page) {
    return await page.evaluate(() => {
        const searchResultsHeader = document.querySelector('#search-results-header');
        if (!searchResultsHeader) {
            console.log('Search results header not found');
            return null;
        }

        // Находим список результатов как дочерний элемент
        const resultsList = searchResultsHeader.querySelector('ul');
        if (!resultsList) {
            console.log('Results list not found');
            return null;
        }

        // Получаем все карточки игр
        const gameCards = resultsList.querySelectorAll('li');
        console.log(`Found ${gameCards.length} game cards`);

        // Функция для извлечения времени из текста
        function extractTime(timeText) {
            // Проверяем, указано ли время в минутах или часах
            const isMinutes = timeText.includes('Mins');
            const isHours = timeText.includes('Hours');
            
            if (!isMinutes && !isHours) {
                console.log(`Unknown time format: ${timeText}`);
                return null;
            }
            
            // Удаляем слова "Hours" или "Mins" и пробелы
            const timeStr = timeText.replace('Hours', '').replace('Mins', '').trim();
            
            // Обрабатываем дроби
            let timeValue;
            if (timeStr.includes('½')) {
                timeValue = parseFloat(timeStr.replace('½', '.5'));
            } else if (timeStr.includes('¼')) {
                timeValue = parseFloat(timeStr.replace('¼', '.25'));
            } else if (timeStr.includes('¾')) {
                timeValue = parseFloat(timeStr.replace('¾', '.75'));
            } else {
                timeValue = parseFloat(timeStr);
            }
            
            // Если время указано в минутах, конвертируем в часы
            if (isMinutes) {
                timeValue = timeValue / 60;
            }
            
            // Округляем до 2 знаков после запятой
            return Number(timeValue.toFixed(2));
        }

        // Извлекаем данные из первой карточки
        if (gameCards.length > 0) {
            const firstCard = gameCards[0];
            
            // Извлекаем название игры из тега h2
            const gameTitleElement = firstCard.querySelector('h2 a');
            const gameTitle = gameTitleElement ? gameTitleElement.textContent.trim() : null;
            
            // Находим все блоки с временем
            const timeBlocks = firstCard.querySelectorAll('div[class*="time_"]');
            
            // Создаем объект с результатами, инициализируя все значения как null
            const result = {
                title: gameTitle,
                mainStory: null,
                mainPlusExtras: null,
                completionist: null
            };
            
            // Заполняем значения из найденных блоков
            if (timeBlocks.length >= 1) {
                result.mainStory = extractTime(timeBlocks[0].textContent);
            }
            
            if (timeBlocks.length >= 2) {
                result.mainPlusExtras = extractTime(timeBlocks[1].textContent);
            }
            
            if (timeBlocks.length >= 3) {
                result.completionist = extractTime(timeBlocks[2].textContent);
            }
            
            // Возвращаем результат, если хотя бы одно значение не null
            if (result.mainStory !== null || result.mainPlusExtras !== null || result.completionist !== null) {
                return result;
            }
        }

        return null;
    });
}

/**
 * Получает информацию о времени прохождения игры с сайта HowLongToBeat
 * @param {string} gameName - Название игры
 * @param {Object} [existingBrowser] - Существующий экземпляр браузера
 * @param {boolean} [updateCache=false] - Флаг, указывающий, что нужно обновить данные из кэша
 * @returns {Promise<Object|null>} Информация о времени прохождения
 */
async function getGameCompletionTime(gameName, existingBrowser = null, updateCache = false) {
    const cache = await getCache();
    // Проверяем кэш только если не указан флаг updateCache
    if (!updateCache) {
        const cachedData = cache.get(gameName);
        if (cachedData !== undefined) {
            console.log(`Using cached data for: ${gameName}`);
            return cachedData;
        }
    } else {
        console.log(`Cache update requested for: ${gameName}`);
    }

    let browser = existingBrowser;
    let page = null;
    let shouldCloseBrowser = false;

    try {
        // Используем существующий браузер или создаем новый
        if (!browser) {
            browser = await createBrowser();
            shouldCloseBrowser = true;
        }

        // Получаем готовую страницу
        page = await getPreparedPage(browser);

        // Используем соответствие из GAME_NAME_MAP, если оно есть
        const searchName = GAME_NAME_MAP[gameName] || gameName;
        if (GAME_NAME_MAP[gameName]) {
            console.log(`Searching for game: ${searchName} (original: ${gameName})`);
        } else {
            console.log(`Searching for game: ${searchName}`);
        }
        
        // Создаем объект для кэша
        let result = null;
        
        // Очищаем название игры только от специальных символов для первого поиска
        const symbolsCleanedName = cleanGameName(searchName, 'symbols');
        
        // Пробуем поиск с названием, очищенным от специальных символов
        try {
            // Переходим на страницу поиска
            const searchUrl = `https://howlongtobeat.com/?q=${encodeURIComponent(symbolsCleanedName)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

            await page.waitForSelector(CARD_ITEM_SELECTOR, { timeout: MAX_WAIT_SELECTOR_TIMEOUT });

            console.log('Analyzing search results...');
            // Анализируем структуру результатов поиска
            const searchResults = await extractGameCompletionData(page);

            console.log('Extracted times:', searchResults);
            
            if (searchResults) {
                // Создаем объект только с данными о времени
                result = {
                    mainStory: searchResults.mainStory,
                    mainPlusExtras: searchResults.mainPlusExtras,
                    completionist: searchResults.completionist
                };
                
                // Если название игры в HLTB отличается от названия в Steam, добавляем его
                if (searchResults.title && searchResults.title !== gameName) {
                    result.hltbGameTitle = searchResults.title;
                }
            }
        } catch (error) {
            console.error('Error during search with symbols-cleaned name:', error);
        }
        
        // Если не удалось найти игру с названием, очищенным от символов, пробуем поиск с полной очисткой
        if (!result) {
            // Очищаем название игры от суффиксов и специальных символов
            const fullyCleanedName = cleanGameName(searchName, 'full');
            
            // Если полностью очищенное название отличается от очищенного от символов, пробуем поиск с ним
            if (fullyCleanedName !== symbolsCleanedName) {
                console.log(`Trying search with fully cleaned name: ${fullyCleanedName}`);
                
                try {
                    // Переходим на страницу поиска с полностью очищенным названием
                    const fullyCleanedSearchUrl = `https://howlongtobeat.com/?q=${encodeURIComponent(fullyCleanedName)}`;
                    await page.goto(fullyCleanedSearchUrl, { waitUntil: 'domcontentloaded' });
                    
                    await page.waitForSelector(CARD_ITEM_SELECTOR, { timeout: MAX_WAIT_SELECTOR_TIMEOUT });
                    
                    // Анализируем результаты поиска
                    const fullyCleanedSearchResults = await extractGameCompletionData(page);
                    
                    if (fullyCleanedSearchResults) {
                        console.log('Found game with fully cleaned name:', fullyCleanedSearchResults);
                        
                        // Создаем объект только с данными о времени
                        result = {
                            mainStory: fullyCleanedSearchResults.mainStory,
                            mainPlusExtras: fullyCleanedSearchResults.mainPlusExtras,
                            completionist: fullyCleanedSearchResults.completionist
                        };
                        
                        // Если название игры в HLTB отличается от названия в Steam, добавляем его
                        if (fullyCleanedSearchResults.title && fullyCleanedSearchResults.title !== gameName) {
                            result.hltbGameTitle = fullyCleanedSearchResults.title;
                        }
                    }
                } catch (error) {
                    console.error(`Error during search with fully cleaned name:`, error);
                }
            }
        }
        
        // Сохраняем результат в кэш (даже если это null)
        await cache.add(gameName, result);

        return result;
    } catch (error) {
        console.error('Error in getGameCompletionTime:', error);
        // Сохраняем null в кэш в случае ошибки
        await cache.add(gameName, null);
        return null;
    } finally {
        // Закрываем браузер только если мы его создали
        if (shouldCloseBrowser && browser) {
            await closeBrowser(browser);
        }
    }
}

module.exports = {
    getGameCompletionTime
}; 