import * as puppeteer from 'puppeteer';

const FILTERED_CLIENT_ERRORS: string[] = [
    'Failed to load resource',
    'Refused to execute script',
    'geolocation.onetrust.com',
];

/**
 * Создает новый экземпляр браузера Puppeteer
 * @returns Экземпляр браузера
 */
export async function createBrowser(): Promise<puppeteer.Browser> {
    // console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,
        dumpio: false,
        args: [
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--disable-blink-features=AutomationControlled',
        ],
        defaultViewport: { width: 1280, height: 800 }
    });

    const pages = await browser.pages();
    await preparePage(pages[0]);

    return browser;
}

async function preparePage(page: puppeteer.Page): Promise<void> {
    // Устанавливаем User-Agent и дополнительные заголовки
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    // Включаем перехват запросов для блокировки ненужных ресурсов
    // await page.setRequestInterception(true);
    // page.on('request', (request) => {
    //     if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
    //         request.abort();
    //     } else {
    //         request.continue();
    //     }
    // });

    // Перенаправляем консоль браузера в консоль процесса
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();

        // Пропускаем сообщения, содержащие подстроки из FILTERED_CLIENT_ERRORS
        if (type === 'error' && FILTERED_CLIENT_ERRORS.some(error => text.includes(error))) {
            return;
        }

        // Префиксируем сообщения для различения источника
        switch (type) {
            case 'log':
                console.log(`[Browser Log] ${text}`);
                break;
            case 'error':
                console.error(`[Browser Error] ${text}`);
                break;
            case 'warn':
                console.warn(`[Browser Warning] ${text}`);
                break;
            case 'info':
                console.info(`[Browser Info] ${text}`);
                break;
            default:
                console.log(`[Browser ${type}] ${text}`);
        }
    });

    // Перенаправляем ошибки страницы
    page.on('pageerror', error => {
        // Пропускаем ошибки, содержащие подстроки из FILTERED_CLIENT_ERRORS
        if (FILTERED_CLIENT_ERRORS.some(filteredError => error.message.includes(filteredError))) {
            return;
        }
        console.error(`[Browser Page Error] ${error.message}`);
    });
}

/**
 * Получает готовую страницу: если в браузере есть открытая страница, возвращает её,
 * иначе создает новую и настраивает с необходимыми параметрами
 * @param browser - Экземпляр браузера
 * @returns Настроенная страница
 */
export async function getPreparedPage(browser: puppeteer.Browser): Promise<puppeteer.Page> {
    // Проверяем наличие открытых страниц в браузере
    const pages = await browser.pages();
    if (pages.length > 0) {
        console.log('Using existing page');
        return pages[0];
    }

    console.log('Creating new page');
    const page = await browser.newPage();
    await preparePage(page);

    return page;
}

/**
 * Закрывает браузер
 * @param browser - Экземпляр браузера
 */
export async function closeBrowser(browser: puppeteer.Browser): Promise<void> {
    if (browser) {
        console.log('Browser closed');
        await browser.close();
    }
} 