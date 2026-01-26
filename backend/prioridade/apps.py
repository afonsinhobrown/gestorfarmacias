from django.apps import AppConfig
from pathlib import Path


class PrioridadeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'prioridade'
    path = str(Path(__file__).resolve().parent)
    verbose_name = 'Sistema de Prioridade'
    path = str(Path(__file__).resolve().parent)
