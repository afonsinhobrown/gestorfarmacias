from django.apps import AppConfig
from pathlib import Path


class FornecedoresConfig(AppConfig):
    name = 'fornecedores'
    path = str(Path(__file__).resolve().parent)
