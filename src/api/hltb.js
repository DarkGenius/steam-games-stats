const { createBrowser, preparePage, closeBrowser, getPreparedPage } = require('../utils/browser');
const { GAME_NAME_MAP, GAME_SUFFIXES } = require('../utils/const');
const Cache = require('../utils/cache');
const path = require('path');

const CARD_ITEM_SELECTOR = '#search-results-header > ul > li';
const MAX_WAIT_SELECTOR_TIMEOUT = 10000; // 10 секунд в миллисекундах

// Создаем экземпляр кэша
const cache = new Cache(path.join(__dirname, '../../data/hltb_cache.json'));

/**
 * Очищает название игры от суффиксов и специальных символов в конце
 * @param {string} gameName - Исходное название игры
 * @returns {string} Очищенное название игры
 */
function cleanGameName(gameName) {
    // Удаляем суффиксы
    let cleanedName = gameName;
    for (const suffix of GAME_SUFFIXES) {
        if (cleanedName.endsWith(suffix)) {
            cleanedName = cleanedName.slice(0, -suffix.length).trim();
        }
    }
    
    // Удаляем специальные символы в конце
    cleanedName = cleanedName.replace(/[-:—]\s*$/, '').trim();
    
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
            // Удаляем слово "Hours" и пробелы
            const timeStr = timeText.replace('Hours', '').trim();
            
            // Обрабатываем дроби
            if (timeStr.includes('½')) {
                return parseFloat(timeStr.replace('½', '.5'));
            } else if (timeStr.includes('¼')) {
                return parseFloat(timeStr.replace('¼', '.25'));
            } else if (timeStr.includes('¾')) {
                return parseFloat(timeStr.replace('¾', '.75'));
            }
            
            return parseFloat(timeStr);
        }

        // Извлекаем данные из первой карточки
        if (gameCards.length > 0) {
            const firstCard = gameCards[0];
            
            // Извлекаем название игры из тега h2
            const gameTitleElement = firstCard.querySelector('h2 a');
            const gameTitle = gameTitleElement ? gameTitleElement.textContent.trim() : null;
            
            // Находим все блоки с временем
            const timeBlocks = firstCard.querySelectorAll('div[class*="time_"]');
            if (timeBlocks.length >= 3) {
                return {
                    title: gameTitle,
                    mainStory: extractTime(timeBlocks[0].textContent),
                    mainPlusExtras: extractTime(timeBlocks[1].textContent),
                    completionist: extractTime(timeBlocks[2].textContent)
                };
            }
        }

        return null;
    });
}

/**
 * Получает информацию о времени прохождения игры с сайта HowLongToBeat
 * @param {string} gameName - Название игры
 * @param {Object} [existingBrowser] - Существующий экземпляр браузера
 * @returns {Promise<Object|null>} Информация о времени прохождения
 */
async function getGameCompletionTime(gameName, existingBrowser = null) {
    // Проверяем кэш
    const cachedData = cache.get(gameName);
    if (cachedData) {
        console.log(`Using cached data for: ${gameName}`);
        return cachedData;
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
        
        // Пробуем поиск с исходным названием
        try {
            // Переходим на страницу поиска
            const searchUrl = `https://howlongtobeat.com/?q=${encodeURIComponent(searchName)}`;
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
                
                // Сохраняем результат в кэш
                await cache.add(gameName, result);
            }
        } catch (error) {
            console.error('Error during initial search:', error);
            // Продолжаем выполнение, чтобы попробовать поиск без суффикса
        }
        
        // Если не удалось найти игру, пробуем поискать без суффикса
        if (!result) {
            // Очищаем название игры от суффиксов и специальных символов
            const cleanedName = cleanGameName(gameName);
            
            // Если очищенное название отличается от исходного, пробуем поиск с ним
            if (cleanedName !== gameName) {
                console.log(`Trying search with cleaned name: ${cleanedName}`);
                
                try {
                    // Переходим на страницу поиска с очищенным названием
                    const cleanedSearchUrl = `https://howlongtobeat.com/?q=${encodeURIComponent(cleanedName)}`;
                    await page.goto(cleanedSearchUrl, { waitUntil: 'domcontentloaded' });
                    
                    await page.waitForSelector(CARD_ITEM_SELECTOR, { timeout: MAX_WAIT_SELECTOR_TIMEOUT });
                    
                    // Анализируем результаты поиска
                    const cleanedSearchResults = await extractGameCompletionData(page);
                    
                    if (cleanedSearchResults) {
                        console.log('Found game with cleaned name:', cleanedSearchResults);
                        
                        // Создаем объект только с данными о времени
                        result = {
                            mainStory: cleanedSearchResults.mainStory,
                            mainPlusExtras: cleanedSearchResults.mainPlusExtras,
                            completionist: cleanedSearchResults.completionist
                        };
                        
                        // Если название игры в HLTB отличается от названия в Steam, добавляем его
                        if (cleanedSearchResults.title && cleanedSearchResults.title !== gameName) {
                            result.hltbGameTitle = cleanedSearchResults.title;
                        }
                        
                        // Сохраняем результат в кэш
                        await cache.add(gameName, result);
                    }
                } catch (error) {
                    console.error(`Error during search with cleaned name:`, error);
                }
            }
        }

        return result;
    } catch (error) {
        console.error('Error in getGameCompletionTime:', error);
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