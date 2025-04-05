const { getAndSortGames, isValidSteamId, getSteamId } = require('./utils/steam');
const { getGameCompletionTime } = require('./api/hltb');
const fs = require('fs');
const path = require('path');

/**
 * Функция для получения и отображения данных о Steam играх
 * @param {string} steamIdOrVanityUrl - Steam ID или vanity URL
 * @param {string} saveFormat - Формат сохранения: 'json', 'text' или null
 */
async function handleSteamMode(steamIdOrVanityUrl, saveFormat) {
    try {
        // Проверяем, что передан Steam ID или vanity URL
        if (!steamIdOrVanityUrl) {
            console.error('Error: Please provide a valid Steam ID or vanity URL');
            process.exit(1);
        }

        // Проверяем валидность Steam ID или vanity URL
        if (!isValidSteamId(steamIdOrVanityUrl)) {
            console.error('Error: Invalid Steam ID or vanity URL format');
            process.exit(1);
        }

        // Если передан vanity URL, преобразуем его в Steam ID
        let steamId = steamIdOrVanityUrl;
        if (!/^\d+$/.test(steamIdOrVanityUrl)) {
            console.log(`Resolving vanity URL: ${steamIdOrVanityUrl}`);
            steamId = await getSteamId(steamIdOrVanityUrl);
            console.log(`Resolved Steam ID: ${steamId}`);
        }

        // Получаем и сортируем игры
        const games = await getAndSortGames(steamId);
        console.log(`Found ${games.length} games`);

        // Выводим топ-10 игр по времени прохождения
        console.log('\nTop 10 games by playtime:');
        games.slice(0, 10).forEach((game, index) => {
            console.log(`${index + 1}. ${game.name} (${game.playtime_forever} hours)`);
        });

        // Если нужно сохранить игры в файл
        if (saveFormat) {
            // Создаем директорию data, если она не существует
            const dataDir = path.join(__dirname, '..', 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
            }
            
            // Определяем расширение файла и путь
            const extension = saveFormat === 'text' ? '.txt' : '.json';
            const filePath = path.join(dataDir, `${steamId}_games${extension}`);
            
            // Сохраняем игры в файл в зависимости от формата
            if (saveFormat === 'text') {
                // Форматируем игры для текстового файла
                const textContent = games.map((game, index) => 
                    `${index + 1}. ${game.name} (${game.playtime_forever} hours)`
                ).join('\n');
                
                fs.writeFileSync(filePath, textContent);
            } else {
                // Сохраняем в формате JSON
                fs.writeFileSync(filePath, JSON.stringify(games, null, 2));
            }
            
            console.log(`\nGames saved to ${filePath}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

/**
 * Функция для получения и отображения данных о времени прохождения игры
 * @param {string} gameName - Название игры
 */
async function handleHowLongMode(gameName) {
    try {
        if (!gameName) {
            console.error('Error: Please provide a game name');
            console.log('Usage: node src/index.js --how-long "Game Name"');
            process.exit(1);
        }

        console.log(`Fetching completion time for: ${gameName}`);
        const completionTime = await getGameCompletionTime(gameName);
        
        console.log('\nHow Long To Beat:');
        if (completionTime.mainStory) {
            console.log(`Main Story: ${completionTime.mainStory} hours`);
        } else {
            console.log('Main Story: Not available');
        }
        
        if (completionTime.mainPlusExtras) {
            console.log(`Main + Extras: ${completionTime.mainPlusExtras} hours`);
        } else {
            console.log('Main + Extras: Not available');
        }
        
        if (completionTime.completionist) {
            console.log(`Completionist: ${completionTime.completionist} hours`);
        } else {
            console.log('Completionist: Not available');
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

/**
 * Основная функция для определения режима работы и вызова соответствующего обработчика
 */
function main() {
    const args = process.argv.slice(2);
    
    // Проверяем наличие флага --how-long
    const howLongIndex = args.indexOf('--how-long');
    if (howLongIndex !== -1) {
        // Режим HowLongToBeat
        const gameName = args[howLongIndex + 1];
        handleHowLongMode(gameName);
    } else {
        // Режим Steam
        const steamIdOrVanityUrl = args[0];
        
        // Проверяем наличие флага --save и его параметр
        const saveIndex = args.indexOf('--save');
        let saveFormat = null;
        
        if (saveIndex !== -1) {
            // Проверяем, есть ли параметр после --save
            const saveParam = args[saveIndex + 1];
            if (saveParam && (saveParam === 'json' || saveParam === 'text')) {
                saveFormat = saveParam;
            } else {
                // По умолчанию используем json
                saveFormat = 'json';
            }
        }
        
        handleSteamMode(steamIdOrVanityUrl, saveFormat);
    }
}

// Запускаем основную функцию
main(); 