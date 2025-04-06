/**
 * Форматирует время выполнения в миллисекундах в читаемый формат
 * @param {number} ms - Время в миллисекундах
 * @returns {string} Отформатированное время
 */
function formatExecutionTime(ms) {
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

module.exports = {
    formatExecutionTime
}; 