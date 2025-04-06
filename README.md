# Steam Games Stats

Утилита командной строки для получения статистики по играм Steam с дополнительной информацией о времени прохождения с сайта HowLongToBeat.

## Возможности

- Получение списка игр пользователя Steam с информацией о времени игры
- Получение информации о времени прохождения игр с сайта HowLongToBeat
- Сортировка игр по времени игры
- Вывод топ-10 игр по времени игры
- Сохранение результатов в JSON или текстовом формате
- Кэширование данных о времени прохождения для ускорения работы

## Установка

1. Клонируйте репозиторий:
```bash
git clone [url репозитория]
cd steam-games-stats
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` в корневой директории проекта и добавьте в него ваш Steam API ключ:
```
STEAM_API_KEY=ваш_api_ключ
```
Получить Steam API ключ можно на странице: https://steamcommunity.com/dev/apikey

## Использование

### Режим Steam

Получение статистики по играм Steam пользователя:

```bash
node src/index.js --steam-id <STEAM_ID> [опции]
```

Опции:
- `--format <format>` - формат вывода (json или text, по умолчанию text)
- `--add-how-long` - добавить информацию о времени прохождения с HowLongToBeat
- `--update-cache` - обновить кэш данных о времени прохождения (игнорировать существующие кэшированные данные)

Пример:
```bash
node src/index.js --steam-id 76561234567890123 --add-how-long --format text
```

### Режим HowLongToBeat

Получение информации о времени прохождения конкретной игры:

```bash
node src/index.js --how-long "название игры" [опции]
```

Опции:
- `--update-cache` - обновить кэш данных о времени прохождения (игнорировать существующие кэшированные данные)

Пример:
```bash
node src/index.js --how-long "The Witcher 3: Wild Hunt" --update-cache
```

## Формат вывода

### Текстовый формат (--format text)

```
1. Название игры (время игры в часах)
   Main Story: X hours
   Main + Extras: Y hours
   Completionist: Z hours
```

### JSON формат (--format json)

```json
[
  {
    "name": "Название игры",
    "playtime_forever": время_в_часах,
    "howLongToBeat": {
      "title": "Название игры на HowLongToBeat",
      "mainStory": время_в_часах,
      "mainPlusExtras": время_в_часах,
      "completionist": время_в_часах
    }
  }
]
```

## Зависимости

- Node.js
- axios - HTTP клиент для работы с API
- commander - парсинг аргументов командной строки
- dotenv - работа с переменными окружения
- puppeteer - веб-скрапинг для HowLongToBeat 