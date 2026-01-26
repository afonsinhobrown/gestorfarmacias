from django.apps import AppConfig
from pathlib import Path


class FinanceiroConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'financeiro'
    path = str(Path(__file__).resolve().parent)
