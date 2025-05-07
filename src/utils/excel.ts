import * as ExcelJS from 'exceljs';
import * as path from 'path';
import { SteamGame } from '../types';

/**
 * Экспортирует данные о играх в Excel файл
 * @param games - Массив объектов с данными об играх
 * @param filename - Имя файла для сохранения (без расширения)
 * @returns - Путь к сохраненному файлу
 */
export async function exportGamesToExcel(games: SteamGame[], filename: string): Promise<string> {
    // Создаем новую книгу Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Steam Games Stats';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Добавляем лист с данными
    const worksheet = workbook.addWorksheet('Steam Games');
    
    // Определяем колонки
    worksheet.columns = [
        { header: 'Название игры', key: 'name', width: 30 },
        { header: 'Время игры (часы)', key: 'playtime', width: 20 },
        { header: 'Main Story (часы)', key: 'mainStory', width: 20 },
        { header: 'Осталось до прохождения (часы)', key: 'remainingTime', width: 25 },
        { header: 'Main + Extras (часы)', key: 'mainPlusExtras', width: 20 },
        { header: 'Completionist (часы)', key: 'completionist', width: 20 }
    ];
    
    // Добавляем данные
    games.forEach(game => {
        // Вычисляем оставшееся время для прохождения если оно ещё не вычислено
        let remainingTime: number | string | null | undefined = game.howLongToBeat?.remainingTime;
        if (remainingTime === undefined && game.playtime_forever && game.howLongToBeat?.mainStory) {
            const playtimeHours = game.playtime_forever / 60;
            const mainStoryHours = game.howLongToBeat.mainStory;
            const remaining = mainStoryHours - playtimeHours;
            remainingTime = remaining > 0 ? remaining.toFixed(2) : '0.00';
        }
        
        worksheet.addRow({
            name: game.name,
            playtime: game.playtime_forever ? (game.playtime_forever / 60).toFixed(2) : null,
            mainStory: game.howLongToBeat?.mainStory ? game.howLongToBeat.mainStory.toFixed(2) : null,
            remainingTime: remainingTime,
            mainPlusExtras: game.howLongToBeat?.mainPlusExtras ? game.howLongToBeat.mainPlusExtras.toFixed(2) : null,
            completionist: game.howLongToBeat?.completionist ? game.howLongToBeat.completionist.toFixed(2) : null
        });
    });
    
    // Форматируем заголовки
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Добавляем границы и числовой формат для всех ячеек
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
            // Добавляем границы
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            
            // Устанавливаем числовой формат для столбцов со временем (кроме названия игры)
            if (colNumber > 1 && cell.value !== null) {
                cell.numFmt = '0.00';
            }
        });
    });

    // Добавляем автофильтр для возможности сортировки
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: 6 }
    };
    
    // Добавляем лист с информацией
    const infoSheet = workbook.addWorksheet('Информация');
    infoSheet.columns = [
        { header: 'Параметр', key: 'param', width: 20 },
        { header: 'Значение', key: 'value', width: 40 }
    ];
    
    infoSheet.addRow({ param: 'Дата создания', value: new Date().toLocaleString() });
    infoSheet.addRow({ param: 'Количество игр', value: games.length });
    
    // Форматируем заголовки информационного листа
    infoSheet.getRow(1).font = { bold: true };
    infoSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Добавляем границы для всех ячеек информационного листа
    infoSheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });
    
    // Убеждаемся, что имя файла имеет расширение .xlsx
    if (!filename.endsWith('.xlsx')) {
        filename += '.xlsx';
    }
    
    // Сохраняем файл
    const filePath = path.resolve(filename);
    await workbook.xlsx.writeFile(filePath);
    
    console.log(`Данные экспортированы в файл ${filePath}`);
    return filePath;
} 