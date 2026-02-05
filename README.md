# Django Gallery Project

Проект галереи на Django 6.0.1

## Требования

- Python 3.12 или выше
- pip

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/Kaenair/web_2.git
cd web_2
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
```

3. Активируйте виртуальное окружение:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. Установите зависимости:
```bash
pip install -r requirements.txt
```

## Запуск проекта

1. Выполните миграции:
```bash
python manage.py migrate
```

2. Создайте суперпользователя (опционально):
```bash
python manage.py createsuperuser
```

3. Запустите сервер разработки:
```bash
python manage.py runserver
```

4. Откройте браузер и перейдите по адресу: http://127.0.0.1:8000/

## Структура проекта

```
web_2/
├── config/           # Настройки проекта Django
│   ├── settings.py   # Основные настройки
│   ├── urls.py       # URL маршруты
│   └── wsgi.py       # WSGI конфигурация
├── gallery/          # Приложение галереи
│   ├── templates/    # HTML шаблоны
│   ├── views.py      # Представления
│   ├── models.py     # Модели данных
│   └── admin.py      # Админ панель
├── manage.py         # Утилита управления Django
├── db.sqlite3        # База данных SQLite
└── requirements.txt  # Зависимости проекта
```

## Установленные зависимости

- Django 6.0.1
- asgiref 3.11.0
- sqlparse 0.5.5
- tzdata 2025.3

## Доступные страницы

- `/` - Главная страница галереи
- `/about/` - Страница "О проекте"
- `/admin/` - Административная панель

## Примечания

- Проект использует SQLite в качестве базы данных
- DEBUG режим включен (только для разработки)
- SECRET_KEY следует изменить для production окружения
