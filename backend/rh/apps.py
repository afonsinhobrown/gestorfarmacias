from django.apps import AppConfig
from pathlib import Path

class RhConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rh'
    path = str(Path(__file__).resolve().parent)
