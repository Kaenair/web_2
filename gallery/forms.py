import os
from django import forms
from django.core.exceptions import ValidationError
from .models import Asset

class AssetForm(forms.ModelForm):
    class Meta:
        model = Asset
        fields = ['title', 'file']
        widgets = {
            'title': forms.TextInput(attrs={'placeholder': 'Название модели'}),
        }

    # В Django валидация отдельного поля пишется как clean_<field_name>
    def clean_file(self):
        file = self.cleaned_data['file']

        # Получаем расширение файла (превращаем имя в нижний регистр)
        ext = os.path.splitext(file.name)[1].lower()

        # Список разрешенных форматов
        valid_extensions = ['.glb', '.gltf', '.fbx']

        if ext not in valid_extensions:
            # Выбрасываем ошибку, которая покажется пользователю над полем
            raise ValidationError('Неподдерживаемый формат. Пожалуйста, загрузите .glb, .gltf или .fbx')

        return file
