/**
 * Форматирует время выполнения в миллисекундах в читаемый формат
 * @param ms - Время в миллисекундах
 * @returns Отформатированное время
 */
export function formatExecutionTime(ms: number): string {
    if (ms < 1000) {
        return `${ms}ms`;
    } else if (ms < 60000) {
        return `${(ms / 1000).toFixed(2)}s`;
    } else {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    }
} 