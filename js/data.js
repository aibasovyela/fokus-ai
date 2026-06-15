const SITE = {
  accessKey: "fokus2026",   // мастер-ключ (демо / запасной вход)

  // Личные пароли участников. Логин = пароль; имя подставляется автоматически.
  participants: {
    "zhanara26":  { name: "Жанара" },
    "adilhan26":  { name: "Адильхан" },
    "almaz26":    { name: "Алмаз" },
    "nurbol26":   { name: "Нурбол" },
    "asylzhan26": { name: "Асылжан" },
    "daniyar26":  { name: "Данияр" },
    "dariyan26":  { name: "Дариян" },
    "aisulu26":   { name: "Айсулу" }
  },

  groupProgress: 0,   // <-- сколько модулей группа ЗАВЕРШИЛА (0 = только стартуем, текущий — Актау).
                      //     После прохождения Актау ставь 1, после Атырау — 2 и т.д.
  totalCalls: 20,
  dates: "16.06 — 30.07.2026",

  // Приём ДЗ на наш сервер. Админка куратора: /admin (пароль yelumio2026).
  homeworkEndpoint: "https://fokus-homework-production.up.railway.app/api/submit",

  modules: [
    {
      id: 1,
      city: "АКТАУ",
      title: "База",
      tagline: "Как ИИ работает на самом деле — без мифов и магии",
      calls: 1,
      overview: "ИИ — это не «кнопка шедевр». Разбираем, что под капотом: как модель думает, что такое токены, почему она ошибается и как этим управлять. Фундамент, без которого все остальные модули — гадание.",
      howWeLearn: "Разбираю на живых примерах из реальной работы студии — никаких слайдов с определениями.",
      outcome: "Понимаешь логику любой нейросети ещё до того, как открыл её впервые.",
      platforms: ["ChatGPT", "Claude", "Gemini"],
      learn: [
        "Понимать, как модель думает и что такое токены",
        "Знать, почему нейросеть ошибается",
        "Управлять поведением модели, а не гадать",
        "Видеть логику любой нейросети с первого входа"
      ],
      materials: [
        { type: "pdf", title: "Список сайтов для вдохновения", url: "https://drive.google.com/file/d/1gn19Kkkb5F2E6jwTtX14MT3aJpXOlh0T/view" }
      ]
    },
    {
      id: 2,
      city: "АТЫРАУ",
      title: "LLM",
      tagline: "Текстовые нейросети как рабочая команда, а не игрушка",
      calls: 1,
      overview: "ChatGPT, Claude, Gemini — кто из них для чего. Правило «один запрос = одна задача», итерации вместо принятия первого ответа, новый чат на каждую идею. Учишься получать от LLM результат уровня сотрудника, а не «примерно похоже».",
      howWeLearn: "Тест-драйв моделей в прямом эфире на одних и тех же задачах — видишь разницу сам.",
      outcome: "Закрываешь текстовые задачи (сценарии, офферы, анализ документов) в 3–5 итераций вместо часа мучений.",
      platforms: ["ChatGPT", "Claude", "Gemini"],
      learn: [
        "Выбирать модель под задачу: кто из LLM для чего",
        "Работать по правилу «один запрос = одна задача»",
        "Итерировать вместо принятия первого ответа",
        "Закрывать сценарии и офферы в 3–5 итераций"
      ],
      materials: [
        { type: "pdf", title: "Как выбрать нейросеть под твои задачи", url: "https://drive.google.com/file/d/1HzsxugAF7Klx7HDUdO3juHE4iwyUb4ZP/view" }
      ]
    },
    {
      id: 3,
      city: "АКТОБЕ",
      title: "Промпты",
      tagline: "Формула, после которой нейросеть перестаёт «не понимать»",
      calls: 2,
      overview: "Промпт-инжиниринг как система: Subject + Action + Environment + Style + Lighting + Details. JSON-промпты для сложных сцен. Разбираем 9 типичных ошибок («сделай красиво», расплывчатость, избыток задач) и лекарство от каждой.",
      howWeLearn: "Пишем промпты вместе в реальном времени: тестируем формулировки, сравниваем результат, собираем твою библиотеку.",
      outcome: "Твой промпт читается нейросетью как техническое задание — с первого раза.",
      platforms: ["Claude", "ChatGPT", "JSON-структуры"],
      learn: [
        "Строить промпт по формуле Subject + Action + Environment + Style",
        "Использовать роли, контекст и примеры в запросе",
        "Писать JSON-промпты для сложных сцен",
        "Избегать 9 типичных ошибок промптинга",
        "Превращать запрос в техническое задание"
      ],
      materials: [
        { type: "pdf", title: "Типичные ошибки новичков", url: "https://drive.google.com/file/d/1u1PID0nualj23Qztvu-qMl3-a100LA9Q/view" },
        { type: "pdf", title: "Лучшие промпты в 7 разных сферах", url: "https://drive.google.com/file/d/1NraHY-RbfK-TsAprUIXgAQ0TMA9gjbVy/view" },
        { type: "pdf", title: "Промпты и шаблоны", url: "https://drive.google.com/file/d/1vTztRbBcR8-FhnyJCH8CTFXtrlP0EQWB/view" }
      ]
    },
    {
      id: 4,
      city: "КОСТАНАЙ",
      title: "Изображения",
      tagline: "Коммерческий визуал, за который платят бренды",
      calls: 2,
      overview: "Nano Banana Pro для реализма и предметки, Midjourney для художки, Seedream, Flux, Recraft — когда что. Референсы реальных товаров, Multi-shot (9 ракурсов из одного фото), Inpaint, Relight, Upscale. Свет и оптика: Golden Hour, Macro, Low Angle — словарь, который отличает профи от любителя.",
      howWeLearn: "Генерируем во время созвона: несколько кадров под одну идею, работа со светом, ракурсами и референсами реальных товаров.",
      outcome: "Делаешь предметную съёмку уровня продакшн-студии — без студии.",
      platforms: ["Higgsfield", "Nano Banana Pro", "Midjourney", "Seedream", "Recraft"],
      learn: [
        "Выбирать нейросеть под задачу: реализм, художка, предметка",
        "Делать продуктовые, сценовые и lifestyle-кадры",
        "Делать Multi-shot: 9 ракурсов из одного фото",
        "Дорабатывать кадр: Inpaint, Relight, Upscale",
        "Говорить на языке света: Golden Hour, Macro, Low Angle",
        "Готовить визуал под коммерцию и портфолио"
      ],
      materials: [
        { type: "pdf", title: "Свет", url: "https://drive.google.com/file/d/1D0myuBC0r7U1vSrGuIF97KaQScZzkSGr/view" },
        { type: "pdf", title: "Ракурс", url: "https://drive.google.com/file/d/1ILOXR-hiAOqbg8exyoMb-BEmKg49vovo/view" },
        { type: "pdf", title: "Камера, объектив, линзы", url: "https://drive.google.com/file/d/1KEWP4IZWvLb8EgMdlNnfUf0JcvOoiKtx/view" },
        { type: "pdf", title: "Стили", url: "https://drive.google.com/file/d/1rJiu_cvM-nSdJo2ym7WMSBYBzjlAVJWf/view" },
        { type: "pdf", title: "Промпты по сферам: Еда", url: "https://drive.google.com/file/d/1s6jnhX9CZdvGe0sqpQnwHqL3rlt9uaqj/view" },
        { type: "pdf", title: "Промпты по сферам: Парфюм", url: "https://drive.google.com/file/d/1DpBcKDTWz7KvY4KwnFK4mzfF-9mPXzxy/view" },
        { type: "pdf", title: "Промпты по сферам: Одежда", url: "https://drive.google.com/file/d/1qWPU2uZtYQMgipO_NpfIIbgobr88FnRL/view" },
        { type: "pdf", title: "Промпты по сферам: Кино", url: "https://drive.google.com/file/d/1NPdrHDwPxzZNxsAyj91ummoQrXxqB-fp/view" },
        { type: "pdf", title: "Промпты по сферам: Ювелирные изделия", url: "https://drive.google.com/file/d/1ruwcbXjg8MwKf1oQkk0fKBngJafLV6zX/view" },
        { type: "pdf", title: "Промпты по сферам: Строительство", url: "https://drive.google.com/file/d/1WAmG0Q2oZW8rGhwEjG5Jl0MjymJ4_Uwo/view" }
      ]
    },
    {
      id: 5,
      city: "АСТАНА",
      title: "Видео",
      tagline: "От статичного кадра до рекламного ролика",
      calls: 3,
      overview: "Kling 3.0 (физика движений), Seedance 2.0, Veo. Image-to-video как основной метод, Start Frame → End Frame против артефактов, 8 движений камеры (Orbit, Dolly, Pan...). 6-шаговый пайплайн Yelumio: идея → сценарий → раскадровка → кадры → анимация → монтаж. Marketing Studio для брендовых кампаний.",
      howWeLearn: "Собираем ролик по тому же пайплайну, по которому Yelumio делает работы для Tassay и Shoqan — от идеи до финального файла.",
      outcome: "Собираешь рекламный ролик для бренда от идеи до финального файла.",
      platforms: ["Kling 3.0", "Seedance 2.0", "Veo", "Marketing Studio"],
      learn: [
        "Оживлять кадры: image-to-video без артефактов",
        "Управлять камерой: Orbit, Dolly, Pan и ещё 5 движений",
        "Работать по 6-шаговому пайплайну Yelumio",
        "Монтировать ролик: начало, развитие, финал",
        "Собирать брендовые кампании в Marketing Studio"
      ],
      materials: [
        { type: "pdf", title: "Движение камеры", url: "https://drive.google.com/file/d/1giEHRzZKAtgcbCwAx1f6m1EUcOhIUzod/view" },
        { type: "pdf", title: "Готовые промпты для видео", url: "https://drive.google.com/file/d/1nMLa7hapaZPruA9b8TpDI86U_uvmhXFK/view" },
        { type: "pdf", title: "Форматы под соцсети", url: "https://drive.google.com/file/d/1ydPYPW97T9I5WeIrPhaUI-myHQrihO7A/view" }
      ]
    },
    {
      id: 6,
      city: "КАРАГАНДА",
      title: "Голос и музыка",
      tagline: "80% восприятия видео — это звук",
      calls: 1,
      overview: "Плохой звук убивает самую дорогую графику. ElevenLabs для озвучки и SFX, Suno для уникальной музыки. Матрица подбора: премиум = 60–80 BPM и оркестр, драйв = 120–140 и гитары. Саунд-дизайн дозированно: 1–2 эффекта на сцену, не каша.",
      howWeLearn: "Озвучиваем твои ролики прямо на созвоне: подбираем музыку по матрице, делаем вариант с речью и без.",
      outcome: "Твои ролики звучат как реклама с ТВ, а не как «нейросетка сгенерила».",
      platforms: ["ElevenLabs", "Suno", "Epidemic Sound"],
      learn: [
        "Озвучивать ролики и делать SFX в ElevenLabs",
        "Создавать уникальную музыку в Suno",
        "Подбирать звук по матрице: BPM под настроение",
        "Дозировать саунд-дизайн: 1–2 эффекта на сцену"
      ],
      materials: [
        { type: "pdf", title: "Как подбирать звук под настроение", url: "https://drive.google.com/file/d/1V9Xa-Clro1jScw1BuLSeH40xvG1BhONi/view" }
      ]
    },
    {
      id: 7,
      city: "ПАВЛОДАР",
      title: "ИИ-аватары",
      tagline: "Говорящий человек в кадре — без съёмки",
      calls: 1,
      overview: "Цифровые аватары и липсинк: HeyGen, говорящие головы, клонирование голоса. Когда аватар уместен (обучающий контент, UGC-реклама), а когда выглядит дёшево. Реализм лица, кожи, жестов — чек-лист, по которому отличают живое от пластика.",
      howWeLearn: "Создаём твоего цифрового аватара с нуля на созвоне и соединяем с клонированным голосом.",
      outcome: "Производишь UGC- и экспертный контент потоком — без камеры, света и дублей.",
      platforms: ["HeyGen", "ElevenLabs", "Higgsfield"],
      learn: [
        "Создавать говорящие головы с липсинком",
        "Понимать, когда аватар уместен, а когда дёшев",
        "Производить UGC-контент потоком без камеры и студии"
      ],
      materials: []
    },
    {
      id: 8,
      city: "СЕМЕЙ",
      title: "Claude",
      tagline: "Сайт за час. Бот за вечер. Без единой строчки кода руками",
      calls: 4,
      overview: "Самый жирный блок программы. Claude как рабочий инструмент креатора: лендинг для клиента за час (artifact → деплой на Netlify), Telegram-бот приёма заказов, автоматизация рутины студии через Notion + Claude. Это навык, который в Казахстане пока есть у единиц — и который удваивает твой чек.",
      howWeLearn: "Собираем реальные продукты на созвонах: каждый деплоит свой сайт и запускает своего бота — не учебные проекты.",
      outcome: "К концу модуля у тебя задеплоен собственный рабочий сайт и бот — то, что показываешь клиентам.",
      platforms: ["Claude", "Claude Code", "Netlify", "Notion"],
      learn: [
        "Выжимать из Claude максимум в ежедневной работе",
        "Делать лендинг за час: artifact → деплой на Netlify",
        "Собирать Telegram-бота приёма заказов",
        "Автоматизировать рутину через Notion + Claude",
        "Удваивать чек навыком, который есть у единиц"
      ],
      materials: []
    },
    {
      id: 9,
      city: "ШЫМКЕНТ",
      title: "Агенты · no-code",
      tagline: "Системы, которые работают, пока ты спишь",
      calls: 2,
      overview: "n8n и make.com: связки, которые сами принимают заявки, отвечают в DM, заполняют таблицы, напоминают клиентам. Строим реальные автоматизации под твою нишу — не абстрактные схемы из YouTube, а процессы твоего бизнеса.",
      howWeLearn: "Берём реальную задачу из твоего бизнеса и автоматизируем её полностью прямо на созвоне.",
      outcome: "Минимум одна работающая автоматизация, которая экономит тебе часы в неделю.",
      platforms: ["n8n", "make.com", "Telegram API", "Notion"],
      learn: [
        "Строить связки, которые сами принимают заявки",
        "Автоматизировать ответы в DM и таблицы",
        "Собирать процессы под свою нишу, не схемы из YouTube",
        "Экономить часы в неделю на рутине"
      ],
      materials: []
    },
    {
      id: 10,
      city: "АЛМАТЫ",
      title: "Hermes",
      tagline: "Сборка всего в твой продукт — и первая сделка",
      calls: 3,
      overview: "Финальная точка маршрута. Hermes, упаковка себя: портфолио, кейсы, прайс. Средние чеки в РК, модели оплаты (проект / месяц / retainer), переговоры и как поднимать цену. Live-разбор реального входящего заказа от первого сообщения до счёта. Презентация финальной работы каждого участника и персональный план на 90 дней.",
      howWeLearn: "Каждый презентует финальную работу, упаковывает услугу и получает персональный план на 90 дней. Live-сделка в прямом эфире.",
      outcome: "Упакованная услуга, прайс, план на 90 дней — и вход в закрытый чат Yelumio навсегда.",
      platforms: ["Hermes", "Notion", "Kaspi", "весь стек программы"],
      learn: [
        "Настроить и запустить личного агента Hermes",
        "Упаковать себя: портфолио, кейсы, прайс",
        "Знать чеки в РК и модели оплаты: проект / месяц / retainer",
        "Вести переговоры и поднимать цену",
        "Разобрать live-сделку от сообщения до счёта"
      ],
      materials: []
    }
  ],

  library: [
    { type: "link", title: "Вся папка раздаточных материалов (Google Drive)", url: "https://drive.google.com/drive/folders/19XATtUlaZNb6pPodKeMscz1HtjelTWw5" },
    { type: "pdf",  title: "Список приложений для ведения Instagram", url: "https://drive.google.com/file/d/1BeUmwsDeJFsx0BR1mHBOzAp0ru5M0Gu1/view" },
    { type: "link", title: "Список из 100 нейросетей 2026", url: "https://theresanaiforthat.com" },
    { type: "link", title: "Карта нейросетей (обновляется)", url: "https://landscape.lfai.foundation" }
  ]
};
