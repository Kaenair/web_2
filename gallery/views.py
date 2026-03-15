from django.shortcuts import render, redirect
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from django.core.paginator import Paginator
from .models import Asset
from .forms import AssetForm
from django.http import HttpResponse
import base64
import os
from django.core.files.base import ContentFile

def home(request):
    # 1. Получаем параметры из URL (GET-запроса)
    search_query = request.GET.get('q', '')
    ordering = request.GET.get('ordering', 'new')
    period = request.GET.get('period', '')

    # 2. Базовый запрос: берём ВСЕ
    assets = Asset.objects.all()

    # 3. Применяем поиск
    if search_query:
        assets = assets.filter(title__icontains=search_query)

    # 4. Применяем фильтр по дате
    if period == 'today':
        assets = assets.filter(created_at__date=timezone.now().date())
    elif period == 'week':
        assets = assets.filter(created_at__gte=timezone.now() - timedelta(days=7))
    elif period == 'month':
        assets = assets.filter(created_at__gte=timezone.now() - timedelta(days=30))

    # 5. Применяем сортировку
    if ordering == 'old':
        assets = assets.order_by('created_at')
    elif ordering == 'name':
        assets = assets.order_by('title')
    else:
        assets = assets.order_by('-created_at')

    # 6. Пагинация
    paginator = Paginator(assets, 8)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # 7. Добавляем безопасный размер файла
    for asset in page_obj:
        try:
            asset.file_size = asset.file.size if asset.file and os.path.exists(asset.file.path) else None
        except Exception:
            asset.file_size = None

    context_data = {
        'page_title': 'Главная Галерея',
        'page_obj': page_obj,
        'models_count': assets.count(),
    }
    return render(request, 'gallery/index.html', context_data)

def about(request):
    context_data = {
        'page_title_about': 'О проекте'
    }

    return render(request, 'gallery/about.html', context_data)

def upload(request):
    if request.method == 'POST':
        # Сценарий: Пользователь нажал "Отправить"
        # ВАЖНО: Передаем request.FILES, иначе файл потеряется!
        form = AssetForm(request.POST, request.FILES)
        if form.is_valid():
            # 1. Создаём объект, но пока НЕ сохраняем в базу (commit=False)
            new_asset = form.save(commit=False)

            # 2. Обрабатываем картинку из скрытого поля
            image_data = request.POST.get('image_data')  # Получаем строку Base64

            if image_data:
                # Формат строки: "data:image/jpeg;base64,/9j/4AAQSkZRg..."
                # Нам нужно отрезать заголовок "data:image/jpeg;base64,"
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1]  # получаем "jpeg"

                # Декодируем текст в байты
                data = base64.b64decode(imgstr)

                # Создаём имя файла (берем имя модели + .jpg)
                file_name = f"{new_asset.title}_thumb.{ext}"

                # Сохраняем байты в поле image
                # ContentFile превращает байты в объект, который понимает Django FileField
                new_asset.image.save(file_name, ContentFile(data), save=False)

            # 3. Финальное сохранение в бд
            new_asset.save()

            # И перекидываем пользователя на главную
            return redirect('home')
    else:
        # Сценарий: Пользователь просто зашел на страницу (GET)
        form = AssetForm()  # Создаем пустую форму
    # Отдаем шаблон, передавая туда форму (заполненную ошибками или пустую)
    return render(request, 'gallery/upload.html', {'form': form})
