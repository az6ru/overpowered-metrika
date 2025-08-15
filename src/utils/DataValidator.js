/**
 * @file: DataValidator.js
 * @description: Утилиты для валидации и очистки данных перед отправкой в Яндекс Метрику
 * @dependencies: нет
 * @created: 2025-08-15
 */

class DataValidator {
    /**
     * Максимальные размеры для различных типов данных
     */
    static LIMITS = {
        STRING_MAX_LENGTH: 255,
        OBJECT_MAX_KEYS: 50,
        TOTAL_DATA_SIZE: 8192 // 8KB
    };

    /**
     * Запрещенные ключи (зарезервированные Яндекс Метрикой)
     */
    static RESERVED_KEYS = [
        'ym', 'yaCounter', 'Ya', '_ym', 'yandex_metrika',
        'ecommerce', 'purchase', 'detail', 'add', 'remove'
    ];

    /**
     * Валидация данных перед отправкой в Метрику
     */
    static validate(data) {
        const errors = [];
        const warnings = [];

        if (!data || typeof data !== 'object') {
            errors.push('Данные должны быть объектом');
            return { valid: false, errors, warnings, cleanedData: null };
        }

        // Проверка на зарезервированные ключи
        Object.keys(data).forEach(key => {
            if (this.RESERVED_KEYS.some(reserved => key.toLowerCase().includes(reserved.toLowerCase()))) {
                warnings.push(`Ключ "${key}" может конфликтовать с зарезервированными именами`);
            }
        });

        // Проверка количества ключей
        if (Object.keys(data).length > this.LIMITS.OBJECT_MAX_KEYS) {
            errors.push(`Слишком много параметров: ${Object.keys(data).length}. Максимум: ${this.LIMITS.OBJECT_MAX_KEYS}`);
        }

        // Проверка размера данных
        const dataSize = JSON.stringify(data).length;
        if (dataSize > this.LIMITS.TOTAL_DATA_SIZE) {
            errors.push(`Размер данных слишком большой: ${dataSize} байт. Максимум: ${this.LIMITS.TOTAL_DATA_SIZE}`);
        }

        // Очистка и валидация каждого поля
        const cleanedData = this.cleanData(data);

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            cleanedData
        };
    }

    /**
     * Очистка данных от недопустимых значений
     */
    static cleanData(data) {
        const cleaned = {};

        Object.entries(data).forEach(([key, value]) => {
            const cleanedKey = this.sanitizeKey(key);
            const cleanedValue = this.sanitizeValue(value);

            if (cleanedKey && cleanedValue !== null) {
                cleaned[cleanedKey] = cleanedValue;
            }
        });

        return cleaned;
    }

    /**
     * Очистка ключа
     */
    static sanitizeKey(key) {
        if (typeof key !== 'string') return null;

        // Удаляем недопустимые символы и ограничиваем длину
        return key
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 50)
            .toLowerCase();
    }

    /**
     * Очистка значения
     */
    static sanitizeValue(value) {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === 'string') {
            // Ограничиваем длину строки и удаляем управляющие символы
            return value
                .replace(/[\x00-\x1F\x7F]/g, '')
                .substring(0, this.LIMITS.STRING_MAX_LENGTH);
        }

        if (typeof value === 'number') {
            // Проверяем на корректность числа
            if (!isFinite(value)) return null;
            return Math.round(value * 100) / 100; // Округляем до 2 знаков
        }

        if (typeof value === 'boolean') {
            return value;
        }

        if (Array.isArray(value)) {
            // Преобразуем массив в строку
            return value
                .filter(item => item !== null && item !== undefined)
                .join(',')
                .substring(0, this.LIMITS.STRING_MAX_LENGTH);
        }

        if (typeof value === 'object') {
            // Преобразуем объект в строку JSON
            try {
                return JSON.stringify(value).substring(0, this.LIMITS.STRING_MAX_LENGTH);
            } catch (e) {
                return null;
            }
        }

        return null;
    }

    /**
     * Проверка на персональные данные
     */
    static containsPersonalData(data) {
        const personalDataPatterns = [
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Номера карт
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
            /\b\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/, // Телефоны (российский формат)
            /\b\d{4}\s\d{6}\b/, // Паспортные данные
            /\b\d{3}-\d{3}-\d{3}\b/ // ИНН
        ];

        const dataString = JSON.stringify(data).toLowerCase();

        return personalDataPatterns.some(pattern => pattern.test(dataString));
    }

    /**
     * Фильтрация чувствительных данных
     */
    static filterSensitiveData(data) {
        const sensitiveKeys = [
            'token', 'auth', 'password', 'secret', 'key', 'hash',
            'email', 'phone', 'passport', 'inn', 'card'
        ];

        const filtered = { ...data };

        Object.keys(filtered).forEach(key => {
            const keyLower = key.toLowerCase();
            if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
                delete filtered[key];
            }
        });

        return filtered;
    }

    /**
     * Создание безопасной версии данных для логирования
     */
    static createSafeLogData(data) {
        const safe = { ...data };

        // Маскируем потенциально чувствительные значения
        Object.keys(safe).forEach(key => {
            const value = safe[key];
            const keyLower = key.toLowerCase();

            if (typeof value === 'string') {
                if (keyLower.includes('token') || keyLower.includes('hash')) {
                    safe[key] = value.substring(0, 8) + '***';
                } else if (keyLower.includes('uuid') || keyLower.includes('id')) {
                    safe[key] = value.substring(0, 4) + '***';
                }
            }
        });

        return safe;
    }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidator;
}

if (typeof window !== 'undefined') {
    window.DataValidator = DataValidator;
}
