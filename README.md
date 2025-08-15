# Metrika Score API v2

Интеграция системы анализа браузера OverpoweredJS с Яндекс Метрикой для передачи детальных параметров браузера в систему веб-аналитики.

## 🚀 Возможности

- **Автоматический сбор** параметров браузера через OverpoweredJS
- **Безопасная передача** данных в Яндекс Метрику
- **Фильтрация** чувствительной информации
- **Валидация** данных перед отправкой
- **Гибкая настройка** параметров интеграции
- **Поддержка целей** и событий Метрики
- **Режим отладки** для разработки

## 📋 Собираемые параметры

### Основные характеристики браузера:
- Тип браузера (Chromium, Firefox, WebKit)
- Режим инкогнито
- WebView окружение
- Поддельный User-Agent
- Анти-детект браузер
- Canvas fingerprinting

### Безопасность и производительность:
- Оценка вероятности бота (0-10)
- Время анализа
- Уникальный идентификатор кластера
- Геолокация (коды стран)

## 🛠 Установка и настройка

### 1. Подключение файлов

```html
<!-- Яндекс Метрика -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {
            if (document.scripts[j].src === r) { return; }
        }
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    ym('YOUR_COUNTER_ID', 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true
    });
</script>

<!-- OverpoweredJS (подключите согласно их документации) -->
<script src="path/to/overpoweredjs.js"></script>

<!-- Наша интеграция -->
<script src="src/core/MetrikaIntegration.js"></script>
```

### 2. Базовое использование

```javascript
// Создание экземпляра интеграции
const integration = new MetrikaIntegration(
    'YOUR_COUNTER_ID',                    // ID счетчика Яндекс Метрики
    'public_CtOgbP-edO5NnL6A3rbKtlX0Xzxvx-CVeyW', // Ваш API ключ OverpoweredJS
    {
        autoSend: true,           // Автоматическая отправка при загрузке
        debug: false,             // Режим отладки
        filterSensitiveData: true, // Фильтрация чувствительных данных
        oncePerVisit: true        // Отправка один раз за визит (рекомендуется)
    }
);

// Ручной сбор и отправка данных
integration.collectAndSend().then(result => {
    if (result.skipped) {
        console.log('Данные уже отправлены в этом визите');
    } else if (result.success) {
        console.log('Данные отправлены:', result.data);
    } else {
        console.error('Ошибка:', result.error);
    }
});
```

### 3. Отправка целей с параметрами

```javascript
// Отправка цели при завершении анализа
integration.sendGoal('analysis_completed', {
    analysis_type: 'browser_fingerprint',
    user_category: 'normal'
});

// Отправка цели при обнаружении подозрительной активности
if (botScore > 5) {
    integration.sendGoal('suspicious_activity', {
        bot_score: botScore,
        anti_detect: true
    });
}
```

## ⚙️ Конфигурация

```javascript
const options = {
    autoSend: true,              // Автоматическая отправка при инициализации
    debug: false,                // Вывод отладочной информации в консоль
    filterSensitiveData: true,   // Фильтрация токенов, хешей и других чувствительных данных
    
    // Дополнительные настройки (планируется)
    retryAttempts: 3,           // Количество попыток при ошибке
    retryDelay: 1000,           // Задержка между попытками (мс)
    batchMode: false            // Пакетная отправка данных
};

const integration = new MetrikaIntegration('COUNTER_ID', options);
```

## 📊 Структура передаваемых данных

В Яндекс Метрику передаются следующие параметры:

```javascript
{
    // Основные параметры
    "overpowered_cluster_uuid": "740-VJK-PPQ-1NZ",
    "overpowered_bot_score": 3,
    
    // Характеристики браузера
    "browser_type": "chromium",
    "browser_has_canvas_noise": false,
    "browser_is_incognito": false,
    "browser_is_webview": false,
    "browser_is_android_webview": false,
    "browser_country_codes": "RU",
    "browser_fake_user_agent": false,
    "browser_rooted_device": false,
    "browser_anti_detect": false,
    
    // Дополнительные параметры
    "overpowered_last_seen": 135,
    "overpowered_performance": "35.00ms"
}
```

## 🔧 API Reference

### MetrikaIntegration

#### Конструктор
```javascript
new MetrikaIntegration(metrikaId, overpoweredApiKey, options)
```

**Параметры:**
- `metrikaId` (string) - ID счетчика Яндекс Метрики
- `overpoweredApiKey` (string) - API ключ OverpoweredJS
- `options` (object) - Дополнительные настройки

#### Методы

**collectBrowserData()** - Сбор данных браузера через OverpoweredJS
```javascript
const data = await integration.collectBrowserData();
```

**formatDataForMetrika(rawData)** - Форматирование данных для Метрики
```javascript
const formatted = integration.formatDataForMetrika(rawData);
```

**sendToMetrika(data)** - Отправка данных в Яндекс Метрику
```javascript
const success = integration.sendToMetrika(data);
```

**collectAndSend()** - Сбор и отправка данных (основной метод)
```javascript
const result = await integration.collectAndSend();
```

**sendGoal(goalName, additionalParams)** - Отправка цели с параметрами
```javascript
integration.sendGoal('goal_name', { custom_param: 'value' });
```

## 📁 Структура проекта

```
metrika-score-api2/
├── docs/
│   ├── project.md          # Техническая документация
│   ├── changelog.md        # История изменений
│   └── tasktracker.md      # Трекер задач
├── src/
│   ├── core/
│   │   └── MetrikaIntegration.js  # Основной класс интеграции
│   ├── integrations/       # Интеграции с внешними сервисами
│   └── utils/
│       └── DataValidator.js       # Утилиты валидации данных
├── examples/
│   ├── basic-integration.html     # Базовый пример
│   └── advanced-integration.html  # Расширенный пример
└── README.md
```

## 🎯 Примеры использования

### Базовая интеграция
Откройте `examples/basic-integration.html` для простого примера интеграции.

### Расширенная интеграция
Откройте `examples/advanced-integration.html` для примера с полным функционалом:
- Настройка параметров
- Отладочная информация
- Различные сценарии данных
- Управление целями

## 🔒 Безопасность

### Фильтрация данных
По умолчанию включена фильтрация чувствительных данных:
- Токены авторизации
- Хеши отладки
- Персональная информация

### Валидация
Все данные проходят валидацию перед отправкой:
- Проверка размера данных
- Очистка недопустимых символов
- Проверка на зарезервированные ключи

## 🐛 Отладка

Включите режим отладки для получения детальной информации:

```javascript
const integration = new MetrikaIntegration('COUNTER_ID', {
    debug: true
});
```

В консоли браузера будут отображаться:
- Процесс инициализации
- Собранные данные
- Отправленные параметры
- Ошибки и предупреждения

## 📈 Анализ данных

После интеграции данные будут доступны в Яндекс Метрике:

1. **Отчеты → Стандартные отчеты → Посетители → Параметры посетителей**
2. **Настройки → Цели** - для анализа пользовательских событий
3. **Конструктор отчетов** - для создания кастомных отчетов

## ⚠️ Ограничения

- Максимальный размер данных: 8KB
- Максимальное количество параметров: 50
- Данные должны соответствовать политике конфиденциальности Яндекс Метрики

## 🤝 Поддержка

Для вопросов и предложений:
1. Изучите документацию в папке `docs/`
2. Проверьте примеры в папке `examples/`
3. Создайте issue с описанием проблемы

## 📄 Лицензия

MIT License - подробности в файле LICENSE

---

**Версия:** 1.0.0  
**Дата создания:** 2025-08-15  
**Совместимость:** ES6+, современные браузеры
