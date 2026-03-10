from django.shortcuts import render
from .models import Asset
from .forms import AssetForm 

# Create your views here.
from django.http import HttpResponse
from django.shortcuts import redirect

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
            # Если все поля заполнены верно - сохраняем в БД
            form.save()
            # И перекидываем пользователя на главную
            return redirect('home')
    else:
        # Сценарий: Пользователь просто зашел на страницу (GET)
        form = AssetForm()  # Создаем пустую форму
    # Отдаем шаблон, передавая туда форму (заполненную ошибками или пустую)
    return render(request, 'gallery/upload.html', {'form': form})
