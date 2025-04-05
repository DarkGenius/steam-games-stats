const puppeteer = require('puppeteer');

/**
 * Fetches and parses game completion time from HowLongToBeat
 * @param {string} gameName - Name of the game to search for
 * @returns {Promise<{mainStory: string|null, mainPlusExtras: string|null, completionist: string|null}>}
 */
async function getGameCompletionTime(gameName) {
    let browser = null;
    try {
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: true, // Запускаем в headless режиме
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"'
            ]
        });

        // Create new page
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1280, height: 800 });

        // Установка дополнительных заголовков
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        });

        console.log('Navigating to HowLongToBeat...');
        // Navigate to HowLongToBeat with search query
        await page.goto(`https://howlongtobeat.com/?q=${encodeURIComponent(gameName)}`, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Даем время для загрузки и рендеринга
        await new Promise(resolve => setTimeout(resolve, 5000));

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
                
                // Находим все блоки с временем
                const timeBlocks = firstCard.querySelectorAll('.time_100');
                if (timeBlocks.length >= 3) {
                    return {
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
            mainStory: null,
            mainPlusExtras: null,
            completionist: null
        };
    } catch (error) {
        console.error('Error fetching game completion time:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        return {
            mainStory: null,
            mainPlusExtras: null,
            completionist: null
        };
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed');
        }
    }
}

module.exports = {
    getGameCompletionTime
}; 