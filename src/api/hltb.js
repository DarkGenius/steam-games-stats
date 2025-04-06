const { createBrowser, preparePage, closeBrowser, getPreparedPage } = require('../utils/browser');
const { GAME_NAME_MAP } = require('../utils/const');

/**
 * Получает информацию о времени прохождения игры с сайта HowLongToBeat
 * @param {string} gameName - Название игры
 * @param {Object} [existingBrowser] - Существующий экземпляр браузера
 * @returns {Promise<Object|null>} Информация о времени прохождения
 */
async function getGameCompletionTime(gameName, existingBrowser = null) {
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
        
        // Переходим на страницу поиска
        const searchUrl = `https://howlongtobeat.com/?q=${encodeURIComponent(searchName)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('#search-results-header > ul > li', { timeout: 10000 });

        console.log('Analyzing search results...');
        // Анализируем структуру результатов поиска
        const searchResults = await page.evaluate(() => {
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

        console.log('Extracted times:', searchResults);
        return searchResults || {
            title: null,
            mainStory: null,
            mainPlusExtras: null,
            completionist: null
        };
    } catch (error) {
        console.error('Error fetching game completion time:', error);
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