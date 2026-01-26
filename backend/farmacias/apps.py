from django.apps import AppConfig
from pathlib import Path


class FarmaciasConfig(AppConfig):
    name = 'farmacias'
    path = str(Path(__file__).resolve().parent)
