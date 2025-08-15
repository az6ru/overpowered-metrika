# Настройка интеграции OverpoweredJS + Яндекс Метрика в Google Tag Manager

## 🚀 Быстрая настройка

### Вариант 1: Использование готового GTM скрипта (Рекомендуется)

1. **Создайте пользовательский HTML тег в GTM:**
   - Тип тега: `Custom HTML`
   - HTML код:

```html
<!-- OverpoweredJS -->
<script src="https://cdn.overpoweredjs.com/loader/opjs"></script>

<!-- Интеграция для GTM -->
<script src="https://cdn.jsdelivr.net/gh/az6ru/overpowered-metrika@main/src/gtm/gtm-overpowered-metrika.js"></script>

<script>
// Настройка конфигурации
(function() {
    if (typeof OverpoweredMetrikaDebug !== 'undefined') {
        // Замените на ваши значения
        OverpoweredMetrikaDebug.config.METRIKA_ID = '45047126';
        OverpoweredMetrikaDebug.config.OVERPOWERED_API_KEY = 'public_CtOgbP-edO5NnL6A3rbKtlX0Xzxvx-CVeyW';
        OverpoweredMetrikaDebug.config.DEBUG = true; // Отключите в продакшене
    }
})();
</script>
```

2. **Настройте триггер:**
   - Тип: `Page View - All Pages`
   - Или используйте кастомный триггер по необходимости

### Вариант 2: Использование переменных GTM

1. **Создайте переменные в GTM:**
   - `Metrika Counter ID` = `45047126`
   - `OverpoweredJS API Key` = `public_CtOgbP-edO5NnL6A3rbKtlX0Xzxvx-CVeyW`

2. **HTML код тега:**

```html
<!-- OverpoweredJS -->
<script src="https://cdn.overpoweredjs.com/loader/opjs"></script>

<!-- Интеграция -->
<script>
(function() {
    'use strict';
    
    var CONFIG = {
        METRIKA_ID: '{{Metrika Counter ID}}',
        OVERPOWERED_API_KEY: '{{OverpoweredJS API Key}}',
        DEBUG: false,
        ONCE_PER_VISIT: true
    };

    function OverpoweredMetrikaIntegration() {
        var sessionKey = 'overpowered_metrika_sent_' + CONFIG.METRIKA_ID;
        
        function isAlreadySent() {
            if (!CONFIG.ONCE_PER_VISIT) return false;
            try {
                return sessionStorage.getItem(sessionKey) === 'true';
            } catch (e) {
                return false;
            }
        }
        
        function markAsSent() {
            if (CONFIG.ONCE_PER_VISIT) {
                try {
                    sessionStorage.setItem(sessionKey, 'true');
                } catch (e) {
                    console.warn('[OverpoweredMetrika] SessionStorage недоступен');
                }
            }
        }
        
        function formatForMetrika(data) {
            if (!data) return {};
            
            return {
                overpowered_cluster_uuid: data.clusterUUID,
                overpowered_bot_score: data.botScore,
                browser_type: data.browserTraits ? data.browserTraits.type : null,
                browser_has_canvas_noise: data.browserTraits ? data.browserTraits.hasCanvasNoise : null,
                browser_is_incognito: data.browserTraits ? data.browserTraits.isIncognito : null,
                browser_is_webview: data.browserTraits ? data.browserTraits.isWebView : null,
                browser_country_codes: data.browserTraits && data.browserTraits.possibleCountryCodes ? 
                    data.browserTraits.possibleCountryCodes.join(',') : null,
                browser_fake_user_agent: data.browserTraits ? data.browserTraits.isFakeUserAgent : null,
                browser_anti_detect: data.browserTraits ? data.browserTraits.isAntiDetect : null
            };
        }
        
        function sendToMetrika(data) {
            try {
                if (typeof ym === 'undefined') {
                    throw new Error('Яндекс Метрика не найдена');
                }
                
                ym(CONFIG.METRIKA_ID, 'userParams', data);
                console.log('[OverpoweredMetrika] Данные отправлены в Метрику');
                return true;
            } catch (error) {
                console.error('[OverpoweredMetrika] Ошибка отправки:', error);
                return false;
            }
        }
        
        function collectAndSend() {
            if (isAlreadySent()) {
                console.log('[OverpoweredMetrika] Данные уже отправлены в этом визите');
                return;
            }
            
            if (typeof window.opjs === 'undefined') {
                console.error('[OverpoweredMetrika] OverpoweredJS не найден');
                return;
            }
            
            window.opjs({
                API_KEY: CONFIG.OVERPOWERED_API_KEY
            }).then(function(fingerprint) {
                var formattedData = formatForMetrika(fingerprint);
                var success = sendToMetrika(formattedData);
                
                if (success) {
                    markAsSent();
                }
                
            }).catch(function(error) {
                console.error('[OverpoweredMetrika] Ошибка сбора данных:', error);
            });
        }
        
        return { collectAndSend: collectAndSend };
    }
    
    var integration = OverpoweredMetrikaIntegration();
    
    // Запуск при первом клике
    var clickHandled = false;
    function handleFirstClick() {
        if (clickHandled) return;
        clickHandled = true;
        integration.collectAndSend();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            document.addEventListener('click', handleFirstClick);
        });
    } else {
        document.addEventListener('click', handleFirstClick);
    }
})();
</script>
```

## 🔧 Расширенная настройка

### Триггеры для отправки данных:

1. **При загрузке страницы:**
   - Триггер: `Page View - All Pages`

2. **При первом клике:**
   - Триггер: `Click - All Elements`
   - Дополнительное условие: `Click Count equals 1`

3. **При скролле:**
   - Триггер: `Scroll Depth - 25%`

### Настройка целей Метрики:

Добавьте в конец скрипта:

```javascript
// Отправка целей при подозрительной активности
if (fingerprint.botScore > 5) {
    ym(CONFIG.METRIKA_ID, 'reachGoal', 'suspicious_activity', {
        bot_score: fingerprint.botScore,
        anti_detect: fingerprint.browserTraits.isAntiDetect
    });
}
```

## 🐛 Отладка в GTM

### Включение отладки:

1. Установите `DEBUG: true` в конфигурации
2. Откройте консоль браузера
3. Проверьте логи с префиксом `[OverpoweredMetrika]`

### Проверка работы:

1. **Предварительный просмотр GTM:**
   - Используйте режим предварительного просмотра GTM
   - Проверьте срабатывание тега

2. **Консоль браузера:**
   ```javascript
   // Проверка доступности API
   console.log('OverpoweredJS:', typeof window.opjs);
   console.log('Яндекс Метрика:', typeof window.ym);
   
   // Проверка отправки данных
   console.log('Данные отправлены:', sessionStorage.getItem('overpowered_metrika_sent_45047126'));
   ```

3. **Яндекс Метрика:**
   - Перейдите в отчет "Параметры посетителей"
   - Проверьте наличие параметров с префиксом `overpowered_` и `browser_`

## ⚠️ Важные замечания

### Совместимость:
- Скрипт написан на ES5 для совместимости с GTM
- Не использует современные JavaScript функции
- Работает во всех браузерах, поддерживаемых GTM

### Производительность:
- Отправка происходит только один раз за визит
- Используется sessionStorage для отслеживания
- Минимальное влияние на скорость загрузки

### Безопасность:
- API ключ OverpoweredJS можно хранить в переменных GTM
- Чувствительные данные автоматически фильтруются
- Соответствие политике конфиденциальности Яндекс Метрики

## 📋 Чек-лист настройки

- [ ] Создан тег Custom HTML в GTM
- [ ] Указаны корректные ID Метрики и API ключ OverpoweredJS  
- [ ] Настроен триггер для срабатывания тега
- [ ] Опубликован контейнер GTM
- [ ] Проверена работа в режиме предварительного просмотра
- [ ] Отключена отладка в продакшене (`DEBUG: false`)
- [ ] Проверены данные в отчетах Яндекс Метрики

## 🆘 Решение проблем

### "OverpoweredJS не найден":
- Проверьте подключение CDN скрипта
- Убедитесь, что скрипт загружается до выполнения интеграции

### "Яндекс Метрика не найдена":
- Убедитесь, что счетчик Метрики установлен на странице
- Проверьте корректность ID счетчика

### Данные не отображаются в Метрике:
- Проверьте консоль на ошибки
- Убедитесь, что данные отправляются (включите отладку)
- Подождите до 30 минут для обновления отчетов Метрики
