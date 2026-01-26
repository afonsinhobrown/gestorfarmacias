from django.apps import AppConfig
from pathlib import Path


class ClientesConfig(AppConfig):
    name = 'clientes'
    path = str(Path(__file__).resolve().parent)
