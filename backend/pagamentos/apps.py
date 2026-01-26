from django.apps import AppConfig
from pathlib import Path


class PagamentosConfig(AppConfig):
    name = 'pagamentos'
    path = str(Path(__file__).resolve().parent)
