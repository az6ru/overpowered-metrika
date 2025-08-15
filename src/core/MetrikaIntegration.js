/**
 * @file: MetrikaIntegration.js
 * @description: Основной класс для интеграции OverpoweredJS с Яндекс Метрикой
 * @dependencies: OverpoweredJS API, Яндекс Метрика
 * @created: 2025-08-15
 */

class MetrikaIntegration {
    /**
     * Конструктор класса интеграции
     * @param {string} metrikaId - ID счетчика Яндекс Метрики
     * @param {Object} options - Дополнительные настройки
     */
    constructor(metrikaId, overpoweredApiKey, options = {}) {
        this.metrikaId = metrikaId;
        this.overpoweredApiKey = overpoweredApiKey;
        this.options = {
            autoSend: true,
            debug: false,
            filterSensitiveData: true,
            oncePerVisit: true, // Новая опция - отправка один раз за визит
            ...options
        };
        
        this.overpoweredData = null;
        this.isInitialized = false;
        this.sessionKey = 'overpowered_metrika_sent_' + this.metrikaId;
        
        this.init();
    }

    /**
     * Инициализация интеграции
     */
    async init() {
        try {
            if (this.options.debug) {
                console.log('[MetrikaIntegration] Инициализация...');
            }

            // Проверяем доступность Яндекс Метрики
            if (typeof ym === 'undefined') {
                throw new Error('Яндекс Метрика не найдена');
            }

            // Проверяем доступность OverpoweredJS
            if (typeof window.opjs === 'undefined') {
                throw new Error('OverpoweredJS не найден. Убедитесь, что подключен скрипт: https://cdn.overpoweredjs.com/loader/opjs');
            }

            this.isInitialized = true;

            if (this.options.autoSend) {
                await this.collectAndSend();
            }

        } catch (error) {
            console.error('[MetrikaIntegration] Ошибка инициализации:', error);
        }
    }

    /**
     * Сбор данных через OverpoweredJS API
     */
    async collectBrowserData() {
        try {
            if (this.options.debug) {
                console.log('[MetrikaIntegration] Сбор данных браузера...');
            }

            // Предполагаемый вызов API OverpoweredJS
            // Поскольку точная документация недоступна, создаем обертку
            const data = await this.getOverpoweredJSData();
            
            this.overpoweredData = data;
            return data;

        } catch (error) {
            console.error('[MetrikaIntegration] Ошибка сбора данных:', error);
            return null;
        }
    }

    /**
     * Получение данных от OverpoweredJS
     * Использует реальное API opjs
     */
    async getOverpoweredJSData() {
        try {
            if (this.options.debug) {
                console.log('[MetrikaIntegration] Вызов OverpoweredJS API...');
            }

            // Вызываем реальное API OverpoweredJS
            const fingerprint = await window.opjs({
                API_KEY: this.overpoweredApiKey
            });

            if (this.options.debug) {
                console.log('[MetrikaIntegration] Получены данные OverpoweredJS:', fingerprint);
            }

            return fingerprint;

        } catch (error) {
            console.error('[MetrikaIntegration] Ошибка получения данных OverpoweredJS:', error);
            throw error;
        }
    }

    /**
     * Форматирование данных для передачи в Яндекс Метрику
     */
    formatDataForMetrika(rawData) {
        if (!rawData) return {};

        const formattedData = {
            // Основные параметры
            overpowered_cluster_uuid: rawData.clusterUUID,
            overpowered_bot_score: rawData.botScore,
            
            // Характеристики браузера
            browser_type: rawData.browserTraits?.type,
            browser_has_canvas_noise: rawData.browserTraits?.hasCanvasNoise,
            browser_is_incognito: rawData.browserTraits?.isIncognito,
            browser_is_webview: rawData.browserTraits?.isWebView,
            browser_is_android_webview: rawData.browserTraits?.isAndroidWebView,
            browser_country_codes: rawData.browserTraits?.possibleCountryCodes?.join(','),
            browser_fake_user_agent: rawData.browserTraits?.isFakeUserAgent,
            browser_rooted_device: rawData.browserTraits?.isRootedDevice,
            browser_anti_detect: rawData.browserTraits?.isAntiDetect,
            
            // Дополнительные параметры
            overpowered_last_seen: rawData.lastSeen,
            overpowered_performance: rawData.debug?.performance
        };

        // Фильтрация чувствительных данных
        if (this.options.filterSensitiveData) {
            delete formattedData.overpowered_auth_token;
            delete formattedData.overpowered_debug_hash;
        }

        return formattedData;
    }

    /**
     * Отправка данных в Яндекс Метрику
     */
    sendToMetrika(data) {
        try {
            if (!this.isInitialized) {
                throw new Error('Интеграция не инициализирована');
            }

            if (this.options.debug) {
                console.log('[MetrikaIntegration] Отправка данных в Метрику:', data);
            }

            // Отправка через userParams API
            ym(this.metrikaId, 'userParams', data);

            if (this.options.debug) {
                console.log('[MetrikaIntegration] Данные успешно отправлены');
            }

            return true;

        } catch (error) {
            console.error('[MetrikaIntegration] Ошибка отправки в Метрику:', error);
            return false;
        }
    }

    /**
     * Проверка, были ли данные уже отправлены в этом визите
     */
    isAlreadySentThisVisit() {
        if (!this.options.oncePerVisit) {
            return false; // Если опция отключена, всегда разрешаем отправку
        }

        return sessionStorage.getItem(this.sessionKey) === 'true';
    }

    /**
     * Отметка об отправке данных в этом визите
     */
    markAsSentThisVisit() {
        if (this.options.oncePerVisit) {
            sessionStorage.setItem(this.sessionKey, 'true');
        }
    }

    /**
     * Сбор и отправка данных (основной метод)
     */
    async collectAndSend() {
        try {
            // Проверяем, не отправляли ли мы уже данные в этом визите
            if (this.isAlreadySentThisVisit()) {
                if (this.options.debug) {
                    console.log('[MetrikaIntegration] Данные уже отправлены в этом визите, пропускаем');
                }
                return { success: true, skipped: true, reason: 'already_sent_this_visit' };
            }

            const rawData = await this.collectBrowserData();
            if (!rawData) {
                throw new Error('Не удалось собрать данные браузера');
            }

            const formattedData = this.formatDataForMetrika(rawData);
            const success = this.sendToMetrika(formattedData);

            if (success) {
                // Отмечаем, что данные отправлены в этом визите
                this.markAsSentThisVisit();
                
                if (this.options.debug) {
                    console.log('[MetrikaIntegration] Данные отправлены и помечены для текущего визита');
                }
            }

            return { success, data: formattedData };

        } catch (error) {
            console.error('[MetrikaIntegration] Ошибка в collectAndSend:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Отправка данных при достижении цели
     */
    sendGoal(goalName, additionalParams = {}) {
        try {
            const goalData = {
                ...this.formatDataForMetrika(this.overpoweredData),
                ...additionalParams
            };

            ym(this.metrikaId, 'reachGoal', goalName, goalData);

            if (this.options.debug) {
                console.log(`[MetrikaIntegration] Цель "${goalName}" отправлена с данными:`, goalData);
            }

            return true;

        } catch (error) {
            console.error('[MetrikaIntegration] Ошибка отправки цели:', error);
            return false;
        }
    }

    // Вспомогательные методы для детекции параметров браузера
    detectBrowserType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('chrome')) return 'chromium';
        if (userAgent.includes('firefox')) return 'firefox';
        if (userAgent.includes('safari')) return 'webkit';
        if (userAgent.includes('edge')) return 'edge';
        return 'unknown';
    }

    detectIncognito() {
        // Упрощенная детекция режима инкогнито
        return !window.indexedDB || 
               navigator.webdriver === true ||
               window.sessionStorage === null;
    }

    detectWebView() {
        return /wv/.test(navigator.userAgent) || 
               window.navigator.standalone === false;
    }

    detectAndroidWebView() {
        return /Android/.test(navigator.userAgent) && 
               /wv/.test(navigator.userAgent);
    }

    generateHash() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

// Экспорт для использования в модульной системе
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetrikaIntegration;
}

// Глобальный доступ для браузера
if (typeof window !== 'undefined') {
    window.MetrikaIntegration = MetrikaIntegration;
}
