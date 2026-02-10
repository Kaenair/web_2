from django.shortcuts import render
from .models import Asset

# Create your views here.
from django.http import HttpResponse

def home(request):

    assets = Asset.objects.all().order_by('-created_at')
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
    context_data = {
        'page_title': 'Загрузка модели'
    }
    return render(request, 'gallery/upload.html', context_data)
