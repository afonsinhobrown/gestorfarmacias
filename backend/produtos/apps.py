from django.apps import AppConfig
from pathlib import Path


class ProdutosConfig(AppConfig):
    name = 'produtos'
    path = str(Path(__file__).resolve().parent)
