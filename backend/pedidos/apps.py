from django.apps import AppConfig
from pathlib import Path


class PedidosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pedidos'
    path = str(Path(__file__).resolve().parent)

    def ready(self):
        import pedidos.signals
