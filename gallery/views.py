from django.shortcuts import render
from .models import Asset
from .forms import AssetForm

# Create your views here.
from django.http import HttpResponse
from django.shortcuts import redirect
import base64
from django.core.files.base import ContentFile

def home(request):
    import os
    assets = Asset.objects.all().order_by('-created_at')

    # Добавляем безопасный размер файла — None если файл не существует на диске
    for asset in assets:
        try:
            asset.file_size = asset.file.size if asset.file and os.path.exists(asset.file.path) else None
        except Exception:
            asset.file_size = None

    context_data = {
        'page_title': 'Главная Галерея',
        'assets': assets,
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
