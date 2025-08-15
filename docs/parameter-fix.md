# Исправление проблемы с передачей параметров в Яндекс Метрику

## 🚨 Проблема

Яндекс Метрика **не передает параметры со значениями `null` или `undefined`**. Поэтому в отчетах видны только параметры с реальными значениями.

## ✅ Решение

### Проблемный код:
```javascript
var metrikaData = {
    overpowered_bot_score: data.botScore,
    browser_type: data.browserTraits ? data.browserTraits.type : null,  // ❌ null не передается
    browser_is_webview: null,  // ❌ null не передается
    browser_country_codes: null  // ❌ null не передается
};
```

### Исправленный код:
```javascript
// Функция для добавления только непустых параметров
function addParam(obj, key, value) {
    if (value !== null && value !== undefined) {
        obj[key] = value;
    }
}

var metrikaData = {};

// Добавляем только существующие параметры
addParam(metrikaData, 'overpowered_bot_score', data.botScore);
addParam(metrikaData, 'overpowered_cluster_uuid', data.clusterUUID);

if (data.browserTraits) {
    addParam(metrikaData, 'browser_type', data.browserTraits.type);
    addParam(metrikaData, 'browser_has_canvas_noise', data.browserTraits.hasCanvasNoise);
    addParam(metrikaData, 'browser_is_incognito', data.browserTraits.isIncognito);
    addParam(metrikaData, 'browser_is_webview', data.browserTraits.isWebView);
    addParam(metrikaData, 'browser_is_android_webview', data.browserTraits.isAndroidWebView);
    addParam(metrikaData, 'browser_fake_user_agent', data.browserTraits.isFakeUserAgent);
    addParam(metrikaData, 'browser_rooted_device', data.browserTraits.isRootedDevice);
    addParam(metrikaData, 'browser_anti_detect', data.browserTraits.isAntiDetect);
    
    // Массив стран как строка
    if (data.browserTraits.possibleCountryCodes && data.browserTraits.possibleCountryCodes.length > 0) {
        addParam(metrikaData, 'browser_country_codes', data.browserTraits.possibleCountryCodes.join(','));
    }
}
```

## 🔧 Готовый исправленный код для GTM

Используйте файл `examples/gtm-fixed-code.html` - в нем исправлена проблема с передачей параметров.

### Основные изменения:

1. **Убраны `null` значения** - передаются только реальные данные
2. **Добавлены дополнительные параметры:**
   - `overpowered_risk_level` - уровень риска (low/medium/high)
   - `overpowered_timestamp` - время анализа
   - `overpowered_performance` - время выполнения анализа

3. **Улучшена отладка:**
   - Показывается количество передаваемых параметров
   - Детальное логирование процесса

## 📊 Ожидаемый результат

После исправления в Яндекс Метрике будут видны **все доступные параметры**:

```json
{
  "__ymu": {
    "overpowered_bot_score": 3,
    "overpowered_cluster_uuid": "740-VJK-PPQ-1NZ",
    "overpowered_last_seen": 135,
    "overpowered_risk_level": "low",
    "overpowered_timestamp": "2025-08-15T10:30:00.000Z",
    "overpowered_performance": "35.00ms",
    "browser_type": "chromium",
    "browser_has_canvas_noise": false,
    "browser_is_incognito": false,
    "browser_is_webview": false,
    "browser_is_android_webview": false,
    "browser_fake_user_agent": false,
    "browser_rooted_device": false,
    "browser_anti_detect": false,
    "browser_country_codes": "RU"
  }
}
```

## 🛠️ Отладочные функции

В исправленном коде добавлены функции для отладки:

```javascript
// Принудительный запуск (в консоли браузера)
OverpoweredMetrikaForceRun();

// Очистка сессии для повторного тестирования
OverpoweredMetrikaClearSession();
```

## 📝 Инструкция по замене

1. **Замените код в GTM** на исправленную версию из `gtm-fixed-code.html`
2. **Установите `DEBUG = true`** для проверки
3. **Опубликуйте контейнер GTM**
4. **Проверьте консоль** - должно показывать количество передаваемых параметров
5. **Проверьте Метрику** через 15-30 минут

Теперь все доступные параметры OverpoweredJS будут корректно переданы в Яндекс Метрику!
