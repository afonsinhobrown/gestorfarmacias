from django.apps import AppConfig
from pathlib import Path


class EntregasConfig(AppConfig):
    name = 'entregas'
    path = str(Path(__file__).resolve().parent)
