from django.shortcuts import render
from .models import Asset

# Create your views here.
from django.http import HttpResponse

def home(request):

    context_data = {
    'page_title': 'Главная Галерея',
    'models_count': 5, 
    }

    assets = Asset.objects.all().order_by('-created_at')
    context_data = {
        'page_title': 'Главная Галерея',
        'assets': assets,
    }
    return render(request, 'gallery/index.html', context_data)

def about(request):
    context_data = {
        'page_title_about': 'О проекте'
    }

    return render(request, 'gallery/about.html', context_data)

