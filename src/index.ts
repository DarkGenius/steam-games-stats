import { getAndSortGames, isValidSteamId, getSteamId } from './utils/steam';
import { getGameCompletionTime } from './api/hltb';
import { formatExecutionTime } from './utils/common';
import { exportGamesToExcel } from './utils/excel';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { createBrowser, getPreparedPage, closeBrowser } from './utils/browser';
import { SteamGame, CommandOptions } from './types';
import { Browser, Page } from 'puppeteer';

const MAX_GAMES_TO_FETCH_FROM_HLTB = 1000;

/**
 * Функция для получения и отображения данных о Steam играх
 * @param steamIdOrVanityUrl - Steam ID или vanity URL
 * @param options - Объект с опциями командной строки
 */
async function handleSteamMode(steamIdOrVanityUrl: string, options: CommandOptions): Promise<void> {
    const startTime = Date.now();
    let browser: Browser | null = null;
    let page: Page | null = null;
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
            // Создаем браузер и страницу
            browser = await createBrowser();
            page = await getPreparedPage(browser);

            const topGames = games.slice(0, MAX_GAMES_TO_FETCH_FROM_HLTB);
            for (const game of topGames) {
                console.log(`Fetching completion time for: ${game.name}`);
                const completionTime = await getGameCompletionTime(game.name, browser, options.updateCache);
                if (completionTime !== null) {
                    game.howLongToBeat = completionTime;
                    
                    // Вычисляем оставшееся время для прохождения
                    if (game.playtime_forever && game.howLongToBeat?.mainStory) {
                        const playtimeHours = game.playtime_forever / 60;
                        const mainStoryHours = game.howLongToBeat.mainStory;
                        const remaining = mainStoryHours - playtimeHours;
                        game.howLongToBeat.remainingTime = remaining > 0 ? parseFloat(remaining.toFixed(2)) : 0;
                    }
                }
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
                if (hltb.remainingTime !== undefined) {
                    output += `\n  Remaining Time: ${hltb.remainingTime} hours`;
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
            let extension: string;
            switch (options.format) {
                case 'text':
                    extension = '.txt';
                    break;
                case 'json':
                    extension = '.json';
                    break;
                case 'excel':
                    extension = '.xlsx';
                    break;
                default:
                    extension = '.txt';
            }
            
            const filePath = path.join(dataDir, `${steamId}_games${extension}`);
            
            // Сохраняем игры в файл в зависимости от формата
            if (options.format === 'text') {
                await saveGamesToTextFile(games, steamId);
            } else if (options.format === 'json') {
                // Сохраняем в формате JSON
                fs.writeFileSync(filePath, JSON.stringify(games, null, 2));
                console.log(`\nGames saved to ${filePath}`);
            } else if (options.format === 'excel') {
                // Экспортируем в Excel
                await exportGamesToExcel(games, filePath);
            }
        }
    } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
    } finally {
        // Закрываем страницу и браузер в конце работы
        if (page) {
            await page.close();
        }
        if (browser) {
            await closeBrowser(browser);  
        }
        
        // Выводим время выполнения
        const executionTime = Date.now() - startTime;
        console.log(`\nSteam mode execution time: ${formatExecutionTime(executionTime)}`);
    }
}

/**
 * Функция для получения и отображения данных о времени прохождения игры
 * @param gameName - Название игры
 * @param updateCache - Флаг, указывающий, что нужно обновить данные из кэша
 */
async function handleHowLongMode(gameName: string, updateCache?: boolean): Promise<void> {
    const startTime = Date.now();
    try {
        if (!gameName) {
            console.error('Error: Please provide a game name');
            console.log('Usage: node src/index.js --how-long "Game Name"');
            process.exit(1);
        }

        console.log(`Fetching completion time for: ${gameName}`);
        const completionTime = await getGameCompletionTime(gameName, null, updateCache);
        
        console.log('\nHow Long To Beat:');
        if (completionTime && completionTime.title) {
            console.log(`Game: ${completionTime.title}`);
        }
        
        if (completionTime && completionTime.mainStory) {
            console.log(`Main Story: ${completionTime.mainStory} hours`);
        } else {
            console.log('Main Story: Not available');
        }
        
        if (completionTime && completionTime.mainPlusExtras) {
            console.log(`Main + Extras: ${completionTime.mainPlusExtras} hours`);
        } else {
            console.log('Main + Extras: Not available');
        }
        
        if (completionTime && completionTime.completionist) {
            console.log(`Completionist: ${completionTime.completionist} hours`);
        } else {
            console.log('Completionist: Not available');
        }
    } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
    } finally {
        // Выводим время выполнения
        const executionTime = Date.now() - startTime;
        console.log(`\nHowLongToBeat mode execution time: ${formatExecutionTime(executionTime)}`);
    }
}

/**
 * Сохраняет список игр в текстовый файл
 * @param games - Массив игр
 * @param steamId - Steam ID пользователя
 */
async function saveGamesToTextFile(games: SteamGame[], steamId: string): Promise<void> {
    const fileName = `data/${steamId}_games.txt`;
    const fileContent = games.map((game, index) => {
        const completionTimes = game.howLongToBeat || {};
        const playtimeHours = (game.playtime_forever / 60).toFixed(1);
        let remainingInfo = '';
        if (completionTimes.remainingTime !== undefined) {
            remainingInfo = `, remainingTime: ${completionTimes.remainingTime} hours`;
        }
        return `${index + 1}. ${game.name} (playTime: ${playtimeHours} hours, mainStory: ${completionTimes.mainStory || 'N/A'} hours, mainAndExtras: ${completionTimes.mainPlusExtras || 'N/A'} hours, completionist: ${completionTimes.completionist || 'N/A'} hours${remainingInfo})`;
    }).join('\n');

    fs.writeFileSync(fileName, fileContent, 'utf8');
    console.log(`Games saved to ${fileName}`);
}

const program = new Command();

program
    .option('--steam-id <id>', 'Steam ID to fetch games for')
    .option('--how-long <game>', 'Get completion time for a specific game')
    .option('--format <format>', 'Output format (json, text, or excel)', 'text')
    .option('--add-how-long', 'Add HowLongToBeat information to Steam games')
    .option('--update-cache', 'Update cache for HowLongToBeat')
    .parse(process.argv);

const options = program.opts() as CommandOptions;

// Проверяем наличие обязательных параметров
if (!options.steamId && !options.howLong) {
    console.error('Error: Either --steam-id or --how-long must be specified');
    process.exit(1);
}

// Обрабатываем запрос в зависимости от режима
if (options.howLong) {
    handleHowLongMode(options.howLong, options.updateCache);
} else if (options.steamId) {
    handleSteamMode(options.steamId, options);
} 