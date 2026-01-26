import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from entregas.models import Entregador

User = get_user_model()

def create_users():
    # 1. Motoboy
    email = 'motoboy@teste.com'
    if not User.objects.filter(email=email).exists():
        user = User.objects.create_user(
            email=email,
            password='123',
            first_name='João',
            last_name='Motoboy',
            tipo_usuario='ENTREGADOR',
            telefone='841234567'
        )
        Entregador.objects.create(
            usuario=user,
            veiculo_tipo='MOTO',
            veiculo_placa='MMM-888',
            is_ativo=True,
            is_verificado=True
        )
        print(f"Usuário MOTOBOY criado: {email} / 123")
    else:
        print(f"MOTOBOY já existe: {email}")

    # 2. Cliente
    email_cli = 'cliente@teste.com'
    if not User.objects.filter(email=email_cli).exists():
        User.objects.create_user(
            email=email_cli,
            password='123',
            first_name='Maria',
            last_name='Cliente',
            tipo_usuario='CLIENTE',
            telefone='829876543'
        )
        print(f"Usuário CLIENTE criado: {email_cli} / 123")
    else:
        print(f"CLIENTE já existe: {email_cli}")

if __name__ == '__main__':
    create_users()
