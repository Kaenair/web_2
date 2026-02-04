from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

def home(request):
    # 1. Готовим данные (Context). Это словарь Python.
    # Ключи словаря станут именами переменных в HTML.
    context_data = {
    'page_title': 'Главная Галерея',
    'models_count': 5, # Попробуйте поменять на 5, чтобы проверить условие
    }
    # 2. Рендерим (смешиваем HTML и данные)
    # Путь указываем относительно папки templates: 'gallery/index.html'
    return render(request, 'gallery/index.html', context_data)
    # Имитация данных из базы (список словарей)
    fake_database = [
        {'id': 1, 'name': 'Sci-Fi Helmet', 'file_size': '15 MB'},
        {'id': 2, 'name': 'Old Chair', 'file_size': '2 MB'},
        {'id': 3, 'name': 'Cyber Truck', 'file_size': '10 MB'},
    ]
    context_data = {
        'page_title': 'Главная Галерея',
        'assets': fake_database, # Передаем весь список
    }
    return render(request, 'gallery/index.html', context_data)

def about(request):
    context_data = {
        'page_title_about': 'О проекте'
    }

    return render(request, 'gallery/about.html', context_data)

