from django.apps import AppConfig


class GalleryConfig(AppConfig):
    name = 'gallery'
    default_auto_field = 'django.db.models.BigAutoField'


    def ready(self):
        import gallery.signals
