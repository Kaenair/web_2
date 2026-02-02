from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
# request — это "письмо" от браузера с данными о пользователе
def home(request):
# Мы пока не используем HTML-шаблоны, просто вернем строку.
    return HttpResponse("<h1>Добро пожаловать в 3D Хранилище</h1><p>Система работает.</p>")