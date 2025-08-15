(function () {
    // Проверка, что скрипт не вызван повторно
    if (window.opjsMetrikaLoaded) return;
    window.opjsMetrikaLoaded = true;
  
    // Конфигурация по умолчанию
    const defaultConfig = {
      counterId: null, // ID счетчика Yandex Metrika (обязательно)
      apiKey: 'public_sIrVH6YnVMte8IasGjBIPDfHy6-ZtdWL2Y3', // API-ключ OverpoweredJS
      paramsToSend: [], // Ключи для передачи (пустой массив = весь объект)
      token: null // Опциональный токен
    };
  
    // Получение конфигурации из window.opjsMetrikaConfig или использование дефолтной
    const config = Object.assign({}, defaultConfig, window.opjsMetrikaConfig || {});
  
    // Функция отправки данных в Yandex Metrika
    function sendToYandexMetrika(fpData) {
      const yaCounter = window[`yaCounter${config.counterId}`];
      if (!yaCounter) {
        console.error('Yandex Metrika не инициализирована. Проверьте counterId.');
        return;
      }
  
      // Фильтрация данных по paramsToSend
      let dataToSend = {};
      if (config.paramsToSend.length > 0) {
        config.paramsToSend.forEach(key => {
          if (fpData.hasOwnProperty(key)) {
            dataToSend[key] = fpData[key];
          }
        });
      } else {
        dataToSend = { ...fpData }; // Полный объект
      }
  
      // Добавление токена, если указан
      if (config.token) {
        dataToSend.token = config.token;
      }
  
      // Отправка как параметры визита и пользователя
      yaCounter.params(dataToSend);
      yaCounter.userParams(dataToSend);
  
      console.log('Данные отправлены в Yandex Metrika:', dataToSend);
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
  
    // Выполнение при загрузке страницы (или можно привязать к событию)
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      fetchAndSendFingerprint();
    } else {
      window.addEventListener('DOMContentLoaded', fetchAndSendFingerprint);
    }
  })();