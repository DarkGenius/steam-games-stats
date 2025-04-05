const { getAndSortGames, isValidSteamId, getSteamId } = require('./utils/steam');
const { getGameCompletionTime } = require('./api/hltb');
const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

/**
 * Функция для получения и отображения данных о Steam играх
 * @param {string} steamIdOrVanityUrl - Steam ID или vanity URL
 * @param {Object} options - Объект с опциями командной строки
 */
async function handleSteamMode(steamIdOrVanityUrl, options) {
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

        // Сортируем игры по времени игры (по убыванию)
        games.sort((a, b) => b.playtime_forever - a.playtime_forever);

        // Если указан флаг --add-how-long, добавляем информацию о времени прохождения только для топ-10 игр
        if (options.addHowLong) {
            console.log('\nFetching completion times from HowLongToBeat for top 10 games...');
            const topGames = games.slice(0, 10);
            for (const game of topGames) {
                console.log(`Fetching completion time for: ${game.name}`);
                const completionTime = await getGameCompletionTime(game.name);
                game.howLongToBeat = completionTime;
            }
        }

        // Выводим топ-10 игр по времени прохождения
        console.log('\nTop 10 games by playtime:');
        games.slice(0, 10).forEach((game, index) => {
            const playtimeHours = (game.playtime_forever / 60).toFixed(1);
            let output = `${index + 1}. ${game.name} (${playtimeHours} hours)`;
            
            // Добавляем информацию о времени прохождения, если она есть
            if (game.howLongToBeat) {
                const hltb = game.howLongToBeat;
                if (hltb.mainStory) {
                    output += `\n  Main Story: ${hltb.mainStory} hours`;
                }
                if (hltb.mainPlusExtras) {
                    output += `\n  Main + Extras: ${hltb.mainPlusExtras} hours`;
                }
                if (hltb.completionist) {
                    output += `\n  Completionist: ${hltb.completionist} hours`;
                }
            }
            console.log(output);
        });

        // Если нужно сохранить игры в файл
        if (options.format) {
            // Создаем директорию data, если она не существует
            const dataDir = path.join(__dirname, '..', 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
            }
            
            // Определяем расширение файла и путь
            const extension = options.format === 'text' ? '.txt' : '.json';
            const filePath = path.join(dataDir, `${steamId}_games${extension}`);
            
            // Сохраняем игры в файл в зависимости от формата
            if (options.format === 'text') {
                // Форматируем игры для текстового файла
                const textContent = games.map((game, index) => {
                    const playtimeHours = (game.playtime_forever / 60).toFixed(1);
                    let line = `${index + 1}. ${game.name} (${playtimeHours} hours)`;
                    if (game.howLongToBeat) {
                        const hltb = game.howLongToBeat;
                        if (hltb.mainStory) {
                            line += ` | Main Story: ${hltb.mainStory}h`;
                        }
                        if (hltb.mainPlusExtras) {
                            line += ` | Main + Extras: ${hltb.mainPlusExtras}h`;
                        }
                        if (hltb.completionist) {
                            line += ` | Completionist: ${hltb.completionist}h`;
                        }
                    }
                    return line;
                }).join('\n');
                
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
        if (completionTime.title) {
            console.log(`Game: ${completionTime.title}`);
        }
        
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

const program = new Command();

program
    .option('--steam-id <id>', 'Steam ID to fetch games for')
    .option('--how-long <game>', 'Get completion time for a specific game')
    .option('--format <format>', 'Output format (json or text)', 'text')
    .option('--add-how-long', 'Add HowLongToBeat information to Steam games')
    .parse(process.argv);

const options = program.opts();

// Проверяем наличие обязательных параметров
if (!options.steamId && !options.howLong) {
    console.error('Error: Either --steam-id or --how-long must be specified');
    process.exit(1);
}

// Обрабатываем запрос в зависимости от режима
if (options.howLong) {
    handleHowLongMode(options.howLong);
} else if (options.steamId) {
    handleSteamMode(options.steamId, options);
} 