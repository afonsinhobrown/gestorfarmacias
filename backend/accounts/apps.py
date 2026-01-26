from django.apps import AppConfig
from pathlib import Path


class AccountsConfig(AppConfig):
    name = 'accounts'
    path = str(Path(__file__).resolve().parent)
