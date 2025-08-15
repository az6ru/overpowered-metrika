(function () {
    // Проверка, что скрипт не вызван повторно
    if (window.opjsMetrikaLoaded) return;
    window.opjsMetrikaLoaded = true;
  
    // Конфигурация по умолчанию
    const defaultConfig = {
      counterId: null, // ID счетчика Yandex Metrika
      apiKey: 'public_sIrVH6YnVMte8IasGjBIPDfHy6-ZtdWL2Y3', // API-ключ OverpoweredJS
      paramsToSend: [], // Ключи для передачи (пустой = весь объект)
      token: null // Опциональный токен
    };
  
    // Получение конфигурации
    const config = Object.assign({}, defaultConfig, window.opjsMetrikaConfig || {});
  
    // Функция отправки данных в Yandex Metrika
    function sendToYandexMetrika(fpData) {
      const yaCounter = window[`yaCounter${config.counterId}`];
      if (!yaCounter) {
        console.error('Yandex Metrika не инициализирована. Проверьте counterId.');
        return;
      }
  
      // Формируем данные для отправки
      let dataToSend = {};
      if (config.paramsToSend.length > 0) {
        config.paramsToSend.forEach(key => {
          // Проверяем наличие ключа в fpData
          if (Object.prototype.hasOwnProperty.call(fpData, key)) {
            dataToSend[key] = fpData[key];
          } else {
            console.warn(`Ключ "${key}" отсутствует в данных OverpoweredJS.`);
          }
        });
      } else {
        dataToSend = { ...fpData }; // Полный объект
      }
  
      // Добавляем токен, если указан
      if (config.token) {
        dataToSend.token = config.token;
      }
  
      // Проверяем, есть ли данные для отправки
      if (Object.keys(dataToSend).length === 0) {
        console.warn('Нет данных для отправки в Yandex Metrika.');
        return;
      }
  
      // Отправка как параметры визита и пользователя
      try {
        yaCounter.params(dataToSend);
        yaCounter.userParams(dataToSend);
        console.log('Данные отправлены в Yandex Metrika:', dataToSend);
      } catch (err) {
        console.error('Ошибка при отправке в Yandex Metrika:', err);
      }
    }
  
    // Основная функция для получения данных и отправки
    function fetchAndSendFingerprint() {
      // Проверка отправки в текущей сессии
      if (sessionStorage.getItem('opjsSentToMetrika')) {
        console.log('Данные уже отправлены в этой сессии.');
        return;
      }
  
      // Проверка наличия opjs
      if (!window.opjs) {
        console.error('OverpoweredJS не загружен.');
        return;
      }
  
      // Проверка counterId
      if (!config.counterId) {
        console.error('Не указан counterId для Yandex Metrika.');
        return;
      }
  
      // Вызов opjs
      window.opjs({ API_KEY: config.apiKey })
        .then(fp => {
          sendToYandexMetrika(fp);
          sessionStorage.setItem('opjsSentToMetrika', 'true');
        })
        .catch(err => {
          console.error('Ошибка получения данных OverpoweredJS:', err);
        });
    }
  
    // Выполнение по клику (для точности bot detection)
    window.addEventListener('click', function handler() {
      fetchAndSendFingerprint();
      window.removeEventListener('click', handler); // Один раз
    });
  })();