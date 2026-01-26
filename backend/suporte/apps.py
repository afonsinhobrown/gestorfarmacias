from django.apps import AppConfig
from pathlib import Path


class SuporteConfig(AppConfig):
    name = 'suporte'
    path = str(Path(__file__).resolve().parent)
