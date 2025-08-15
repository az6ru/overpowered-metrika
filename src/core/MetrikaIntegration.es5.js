/**
 * @file: MetrikaIntegration.es5.js
 * @description: ES5 совместимая версия для Google Tag Manager
 * @dependencies: OverpoweredJS API, Яндекс Метрика
 * @created: 2025-08-15
 */

function MetrikaIntegration(metrikaId, overpoweredApiKey, options) {
    // Конструктор
    this.metrikaId = metrikaId;
    this.overpoweredApiKey = overpoweredApiKey;
    this.options = options || {};
    
    // Настройки по умолчанию
    if (typeof this.options.autoSend === 'undefined') this.options.autoSend = true;
    if (typeof this.options.debug === 'undefined') this.options.debug = false;
    if (typeof this.options.filterSensitiveData === 'undefined') this.options.filterSensitiveData = true;
    if (typeof this.options.oncePerVisit === 'undefined') this.options.oncePerVisit = true;
    
    this.overpoweredData = null;
    this.isInitialized = false;
    this.sessionKey = 'overpowered_metrika_sent_' + this.metrikaId;
    
    // Инициализация
    this.init();
}

/**
 * Инициализация интеграции
 */
MetrikaIntegration.prototype.init = function() {
    var self = this;
    
    try {
        if (self.options.debug) {
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

        self.isInitialized = true;

        if (self.options.autoSend) {
            setTimeout(function() {
                self.collectAndSend();
            }, 100);
        }

    } catch (error) {
        console.error('[MetrikaIntegration] Ошибка инициализации:', error);
    }
};

/**
 * Сбор данных браузера
 */
MetrikaIntegration.prototype.collectBrowserData = function() {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        try {
            if (self.options.debug) {
                console.log('[MetrikaIntegration] Сбор данных браузера...');
            }

            self.getOverpoweredJSData().then(function(data) {
                self.overpoweredData = data;
                resolve(data);
            }).catch(function(error) {
                console.error('[MetrikaIntegration] Ошибка сбора данных:', error);
                reject(error);
            });

        } catch (error) {
            console.error('[MetrikaIntegration] Ошибка сбора данных:', error);
            reject(error);
        }
    });
};

/**
 * Получение данных от OverpoweredJS
 */
MetrikaIntegration.prototype.getOverpoweredJSData = function() {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        try {
            if (self.options.debug) {
                console.log('[MetrikaIntegration] Вызов OverpoweredJS API...');
            }

            // Вызываем реальное API OverpoweredJS
            window.opjs({
                API_KEY: self.overpoweredApiKey
            }).then(function(fingerprint) {
                if (self.options.debug) {
                    console.log('[MetrikaIntegration] Получены данные OverpoweredJS:', fingerprint);
                }
                resolve(fingerprint);
            }).catch(function(error) {
                console.error('[MetrikaIntegration] Ошибка получения данных OverpoweredJS:', error);
                reject(error);
            });

        } catch (error) {
            console.error('[MetrikaIntegration] Ошибка получения данных OverpoweredJS:', error);
            reject(error);
        }
    });
};

/**
 * Форматирование данных для передачи в Яндекс Метрику
 */
MetrikaIntegration.prototype.formatDataForMetrika = function(rawData) {
    if (!rawData) return {};

    var formattedData = {
        // Основные параметры
        overpowered_cluster_uuid: rawData.clusterUUID,
        overpowered_bot_score: rawData.botScore,
        
        // Характеристики браузера
        browser_type: rawData.browserTraits ? rawData.browserTraits.type : undefined,
        browser_has_canvas_noise: rawData.browserTraits ? rawData.browserTraits.hasCanvasNoise : undefined,
        browser_is_incognito: rawData.browserTraits ? rawData.browserTraits.isIncognito : undefined,
        browser_is_webview: rawData.browserTraits ? rawData.browserTraits.isWebView : undefined,
        browser_is_android_webview: rawData.browserTraits ? rawData.browserTraits.isAndroidWebView : undefined,
        browser_country_codes: rawData.browserTraits && rawData.browserTraits.possibleCountryCodes ? 
            rawData.browserTraits.possibleCountryCodes.join(',') : undefined,
        browser_fake_user_agent: rawData.browserTraits ? rawData.browserTraits.isFakeUserAgent : undefined,
        browser_rooted_device: rawData.browserTraits ? rawData.browserTraits.isRootedDevice : undefined,
        browser_anti_detect: rawData.browserTraits ? rawData.browserTraits.isAntiDetect : undefined,
        
        // Дополнительные параметры
        overpowered_last_seen: rawData.lastSeen,
        overpowered_performance: rawData.debug ? rawData.debug.performance : undefined
    };

    // Фильтрация чувствительных данных
    if (this.options.filterSensitiveData) {
        delete formattedData.overpowered_auth_token;
        delete formattedData.overpowered_debug_hash;
    }

    return formattedData;
};

/**
 * Отправка данных в Яндекс Метрику
 */
MetrikaIntegration.prototype.sendToMetrika = function(data) {
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
};

/**
 * Проверка, были ли данные уже отправлены в этом визите
 */
MetrikaIntegration.prototype.isAlreadySentThisVisit = function() {
    if (!this.options.oncePerVisit) {
        return false; // Если опция отключена, всегда разрешаем отправку
    }

    try {
        return sessionStorage.getItem(this.sessionKey) === 'true';
    } catch (e) {
        // Если sessionStorage недоступен, считаем что не отправляли
        return false;
    }
};

/**
 * Отметка об отправке данных в этом визите
 */
MetrikaIntegration.prototype.markAsSentThisVisit = function() {
    if (this.options.oncePerVisit) {
        try {
            sessionStorage.setItem(this.sessionKey, 'true');
        } catch (e) {
            // Игнорируем ошибки sessionStorage
            console.warn('[MetrikaIntegration] Не удалось записать в sessionStorage');
        }
    }
};

/**
 * Сбор и отправка данных (основной метод)
 */
MetrikaIntegration.prototype.collectAndSend = function() {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        try {
            // Проверяем, не отправляли ли мы уже данные в этом визите
            if (self.isAlreadySentThisVisit()) {
                if (self.options.debug) {
                    console.log('[MetrikaIntegration] Данные уже отправлены в этом визите, пропускаем');
                }
                resolve({ success: true, skipped: true, reason: 'already_sent_this_visit' });
                return;
            }

            self.collectBrowserData().then(function(rawData) {
                if (!rawData) {
                    throw new Error('Не удалось собрать данные браузера');
                }

                var formattedData = self.formatDataForMetrika(rawData);
                var success = self.sendToMetrika(formattedData);

                if (success) {
                    // Отмечаем, что данные отправлены в этом визите
                    self.markAsSentThisVisit();
                    
                    if (self.options.debug) {
                        console.log('[MetrikaIntegration] Данные отправлены и помечены для текущего визита');
                    }
                }

                resolve({ success: success, data: formattedData });

            }).catch(function(error) {
                console.error('[MetrikaIntegration] Ошибка в collectAndSend:', error);
                reject({ success: false, error: error.message });
            });

        } catch (error) {
            console.error('[MetrikaIntegration] Ошибка в collectAndSend:', error);
            reject({ success: false, error: error.message });
        }
    });
};

/**
 * Отправка данных при достижении цели
 */
MetrikaIntegration.prototype.sendGoal = function(goalName, additionalParams) {
    try {
        additionalParams = additionalParams || {};
        
        var goalData = this.formatDataForMetrika(this.overpoweredData);
        
        // Добавляем дополнительные параметры
        for (var key in additionalParams) {
            if (additionalParams.hasOwnProperty(key)) {
                goalData[key] = additionalParams[key];
            }
        }

        ym(this.metrikaId, 'reachGoal', goalName, goalData);

        if (this.options.debug) {
            console.log('[MetrikaIntegration] Цель "' + goalName + '" отправлена с данными:', goalData);
        }

        return true;

    } catch (error) {
        console.error('[MetrikaIntegration] Ошибка отправки цели:', error);
        return false;
    }
};

// Глобальный доступ для браузера
if (typeof window !== 'undefined') {
    window.MetrikaIntegration = MetrikaIntegration;
}
