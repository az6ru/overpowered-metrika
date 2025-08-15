/**
 * OverpoweredJS + Yandex Metrika Integration для Google Tag Manager
 * ES5 совместимая версия
 * @version 1.0.0
 * @author OverpoweredJS Integration Team
 */

(function() {
    'use strict';
    
    // Конфигурация (замените на свои значения)
    var CONFIG = {
        METRIKA_ID: '{{Metrika Counter ID}}',        // Переменная GTM или прямое значение
        OVERPOWERED_API_KEY: '{{OverpoweredJS API Key}}', // Переменная GTM или прямое значение
        DEBUG: false,                                 // Включить отладку
        ONCE_PER_VISIT: true                         // Отправлять только один раз за визит
    };

    // Основная функция интеграции
    function OverpoweredMetrikaIntegration() {
        var sessionKey = 'overpowered_metrika_sent_' + CONFIG.METRIKA_ID;
        
        // Проверка на повторную отправку
        function isAlreadySent() {
            if (!CONFIG.ONCE_PER_VISIT) return false;
            try {
                return sessionStorage.getItem(sessionKey) === 'true';
            } catch (e) {
                return false;
            }
        }
        
        // Отметка об отправке
        function markAsSent() {
            if (CONFIG.ONCE_PER_VISIT) {
                try {
                    sessionStorage.setItem(sessionKey, 'true');
                } catch (e) {
                    if (CONFIG.DEBUG) console.warn('[OverpoweredMetrika] SessionStorage недоступен');
                }
            }
        }
        
        // Форматирование данных для Метрики
        function formatForMetrika(data) {
            if (!data) return {};
            
            return {
                overpowered_cluster_uuid: data.clusterUUID,
                overpowered_bot_score: data.botScore,
                browser_type: data.browserTraits ? data.browserTraits.type : null,
                browser_has_canvas_noise: data.browserTraits ? data.browserTraits.hasCanvasNoise : null,
                browser_is_incognito: data.browserTraits ? data.browserTraits.isIncognito : null,
                browser_is_webview: data.browserTraits ? data.browserTraits.isWebView : null,
                browser_is_android_webview: data.browserTraits ? data.browserTraits.isAndroidWebView : null,
                browser_country_codes: data.browserTraits && data.browserTraits.possibleCountryCodes ? 
                    data.browserTraits.possibleCountryCodes.join(',') : null,
                browser_fake_user_agent: data.browserTraits ? data.browserTraits.isFakeUserAgent : null,
                browser_rooted_device: data.browserTraits ? data.browserTraits.isRootedDevice : null,
                browser_anti_detect: data.browserTraits ? data.browserTraits.isAntiDetect : null,
                overpowered_last_seen: data.lastSeen,
                overpowered_performance: data.debug ? data.debug.performance : null
            };
        }
        
        // Отправка в Яндекс Метрику
        function sendToMetrika(data) {
            try {
                if (typeof ym === 'undefined') {
                    throw new Error('Яндекс Метрика не найдена');
                }
                
                ym(CONFIG.METRIKA_ID, 'userParams', data);
                
                if (CONFIG.DEBUG) {
                    console.log('[OverpoweredMetrika] Данные отправлены в Метрику:', data);
                }
                
                return true;
            } catch (error) {
                console.error('[OverpoweredMetrika] Ошибка отправки:', error);
                return false;
            }
        }
        
        // Основная функция сбора и отправки
        function collectAndSend() {
            // Проверяем, не отправляли ли уже
            if (isAlreadySent()) {
                if (CONFIG.DEBUG) {
                    console.log('[OverpoweredMetrika] Данные уже отправлены в этом визите');
                }
                return Promise.resolve({ success: true, skipped: true });
            }
            
            // Проверяем доступность OverpoweredJS
            if (typeof window.opjs === 'undefined') {
                console.error('[OverpoweredMetrika] OverpoweredJS не найден');
                return Promise.resolve({ success: false, error: 'OverpoweredJS не найден' });
            }
            
            if (CONFIG.DEBUG) {
                console.log('[OverpoweredMetrika] Начинаем сбор данных...');
            }
            
            // Собираем данные через OverpoweredJS
            return window.opjs({
                API_KEY: CONFIG.OVERPOWERED_API_KEY
            }).then(function(fingerprint) {
                if (CONFIG.DEBUG) {
                    console.log('[OverpoweredMetrika] Получены данные OverpoweredJS:', fingerprint);
                }
                
                var formattedData = formatForMetrika(fingerprint);
                var success = sendToMetrika(formattedData);
                
                if (success) {
                    markAsSent();
                }
                
                return {
                    success: success,
                    data: formattedData,
                    originalData: fingerprint
                };
                
            }).catch(function(error) {
                console.error('[OverpoweredMetrika] Ошибка сбора данных:', error);
                return {
                    success: false,
                    error: error.message
                };
            });
        }
        
        // Отправка цели с параметрами
        function sendGoal(goalName, additionalParams) {
            try {
                if (typeof ym === 'undefined') {
                    throw new Error('Яндекс Метрика не найдена');
                }
                
                additionalParams = additionalParams || {};
                ym(CONFIG.METRIKA_ID, 'reachGoal', goalName, additionalParams);
                
                if (CONFIG.DEBUG) {
                    console.log('[OverpoweredMetrika] Цель "' + goalName + '" отправлена');
                }
                
                return true;
            } catch (error) {
                console.error('[OverpoweredMetrika] Ошибка отправки цели:', error);
                return false;
            }
        }
        
        // Публичный API
        return {
            collectAndSend: collectAndSend,
            sendGoal: sendGoal,
            isAlreadySent: isAlreadySent,
            config: CONFIG
        };
    }
    
    // Создаем экземпляр интеграции
    var integration = OverpoweredMetrikaIntegration();
    
    // Автоматическая отправка при первом клике
    var clickHandled = false;
    function handleFirstClick() {
        if (clickHandled) return;
        clickHandled = true;
        
        if (CONFIG.DEBUG) {
            console.log('[OverpoweredMetrika] Первый клик - запускаем сбор данных');
        }
        
        integration.collectAndSend().then(function(result) {
            if (result.skipped) {
                if (CONFIG.DEBUG) console.log('[OverpoweredMetrika] Отправка пропущена');
            } else if (result.success) {
                if (CONFIG.DEBUG) console.log('[OverpoweredMetrika] Данные успешно отправлены');
                
                // Отправляем цель при высоком bot score
                if (result.originalData && result.originalData.botScore > 5) {
                    integration.sendGoal('suspicious_activity', {
                        bot_score: result.originalData.botScore
                    });
                }
            } else {
                console.error('[OverpoweredMetrika] Ошибка отправки:', result.error);
            }
        });
    }
    
    // Добавляем обработчик клика
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            document.addEventListener('click', handleFirstClick);
        });
    } else {
        document.addEventListener('click', handleFirstClick);
    }
    
    // Глобальный доступ для отладки
    if (CONFIG.DEBUG) {
        window.OverpoweredMetrikaDebug = integration;
    }
    
})();
