(function () {
    // Проверка, что скрипт не вызван повторно
    if (window.opjsMetrikaLoaded) return;
    window.opjsMetrikaLoaded = true;
  
    // Конфигурация по умолчанию
    const defaultConfig = {
      counterId: null, // ID счетчика Yandex Metrika
      apiKey: null, // API-ключ OverpoweredJS (обязательно через конфигурацию)
      paramsToSend: [], // Ключи для передачи (пустой = весь объект)
      sendAs: 'both', // 'params' | 'userParams' | 'both'
      debug: false // Режим логирования (true = включено)
    };
  
    // Получение конфигурации
    const config = Object.assign({}, defaultConfig, window.opjsMetrikaConfig || {});
    
    // ===== Улучшенный структурный логгер с эмодзи =====
    function maskApiKey(key) {
      if (!key) return '—';
      const s = String(key);
      if (s.length <= 6) return `${'*'.repeat(Math.max(0, s.length - 2))}${s.slice(-2)}`;
      return `${s.slice(0, 2)}${'*'.repeat(s.length - 4)}${s.slice(-2)}`;
    }

    const tag = '[opjs-metrika]';
    function dbg(level, emoji, message, ...args) {
      if (!config.debug) return;
      const text = `${emoji} ${tag} ${message}`;
      if (level === 'warn') return console.warn(text, ...args);
      if (level === 'error') return console.error(text, ...args);
      return console.log(text, ...args);
    }
    const log = {
      init: (msg, ...a) => dbg('info', '🚀', msg, ...a),
      info: (msg, ...a) => dbg('info', 'ℹ️', msg, ...a),
      ok: (msg, ...a) => dbg('info', '✅', msg, ...a),
      warn: (msg, ...a) => dbg('warn', '⚠️', msg, ...a),
      error: (msg, ...a) => dbg('error', '🛑', msg, ...a),
      event: (msg, ...a) => dbg('info', '🖱️', msg, ...a),
      send: (msg, ...a) => dbg('info', '📤', msg, ...a)
    };

    log.init('Инициализация скрипта');
    log.info('Конфигурация загружена', {
      counterId: config.counterId,
      sendAs: config.sendAs,
      paramsToSend: Array.isArray(config.paramsToSend) ? config.paramsToSend : 'all',
      apiKey: maskApiKey(config.apiKey),
      debug: config.debug
    });

    // ===== Защита от дублей и гонок =====
    let inFlight = false;
    const storageKey = `opjsMetrika:${config.counterId || 'no-id'}`;
    function wasSent() { return sessionStorage.getItem(storageKey) === 'true'; }
    function markSent() { sessionStorage.setItem(storageKey, 'true'); }
  
    // Определение отправителя Метрики (ym v2.0 с фолбэком на yaCounter)
    function getMetrikaSender() {
      if (typeof window.ym === 'function' && config.counterId) {
        log.ok('Обнаружен интерфейс Метрики 2.0: ym');
        return function send(method, data) { window.ym(config.counterId, method, data); };
      }
      const yaCounter = window[`yaCounter${config.counterId}`];
      if (yaCounter) {
        log.ok('Обнаружен интерфейс старой Метрики: yaCounter');
        return function send(method, data) {
          if (method === 'params' && typeof yaCounter.params === 'function') yaCounter.params(data);
          if (method === 'userParams' && typeof yaCounter.userParams === 'function') yaCounter.userParams(data);
        };
      }
      log.warn('Интерфейс Метрики не найден (ни ym, ни yaCounter)');
      return null;
    }

    // Функция отправки данных в Yandex Metrika с гибкой семантикой
    function sendToYandexMetrika(fpData) {
      const send = getMetrikaSender();
      if (!send) {
        console.error('Yandex Metrika не инициализирована. Проверьте подключение и counterId.');
        return;
      }

      // Формируем данные для отправки
      let dataToSend = {};
      if (Array.isArray(config.paramsToSend) && config.paramsToSend.length > 0) {
        config.paramsToSend.forEach(key => {
          if (Object.prototype.hasOwnProperty.call(fpData, key)) {
            dataToSend[key] = fpData[key];
          } else {
            log.warn(`Ключ "${key}" отсутствует в данных OverpoweredJS.`);
          }
        });
      } else {
        dataToSend = { ...fpData }; // Полный объект
      }

      // Проверяем, есть ли данные для отправки
      const hasPayload = dataToSend && Object.keys(dataToSend).length > 0;
      if (!hasPayload) {
        console.warn('Нет данных для отправки в Yandex Metrika.');
        return;
      }

      // Отправка согласно конфигу sendAs
      try {
        const sendAs = (config.sendAs || 'both');
        log.send(`Отправка данных в Метрику (sendAs: ${sendAs})`, { keys: Object.keys(dataToSend) });
        if (sendAs === 'params' || sendAs === 'both') send('params', dataToSend);
        if (sendAs === 'userParams' || sendAs === 'both') send('userParams', dataToSend);
        log.ok('Данные отправлены в Yandex Metrika');
      } catch (err) {
        console.error('Ошибка при отправке в Yandex Metrika:', err);
      }
    }
  
    // Основная функция для получения данных и отправки
    function fetchAndSendFingerprint(triggerEventName) {
      // Защита от дублей
      if (wasSent()) {
        log.info('Отправка пропущена: данные уже были отправлены в этой сессии');
        return;
      }
      if (inFlight) {
        log.warn('Запрос уже выполняется, ожидание завершения');
        return;
      }

      // Предварительные проверки
      if (!config.counterId) {
        console.error('Не указан counterId для Yandex Metrika.');
        return;
      }
      if (!config.apiKey) {
        console.error('Не указан apiKey для OverpoweredJS.');
        return;
      }
      if (!window.opjs) {
        console.error('OverpoweredJS не загружен.');
        return;
      }

      inFlight = true;
      log.event(`Первое взаимодействие: ${triggerEventName || 'unknown'}. Запуск сбора отпечатка`);
      window.opjs({ API_KEY: config.apiKey })
        .then(fp => {
          log.ok('Отпечаток получен, подготовка и отправка в Метрику');
          sendToYandexMetrika(fp);
          markSent();
        })
        .catch(err => {
          console.error('Ошибка получения данных OverpoweredJS:', err);
          log.error('Сбой при получении отпечатка', err);
        })
        .finally(() => {
          inFlight = false;
        });
    }
  
    // Надёжный триггер запуска по первому взаимодействию пользователя
    function bindFirstInteractionOnce() {
      const events = ['click', 'pointerdown', 'keydown'];
      log.info('Установка обработчиков первого взаимодействия', { events });
      const handler = (ev) => {
        log.event(`Сработало событие: ${ev.type}`);
        unbind();
        fetchAndSendFingerprint(ev.type);
      };
      function unbind() {
        events.forEach((e) => window.removeEventListener(e, handler));
      }
      events.forEach((e) => window.addEventListener(e, handler, { once: true }));
    }

    bindFirstInteractionOnce();
  })();