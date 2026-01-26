import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from farmacias.models import Farmacia
from django.contrib.auth import get_user_model

User = get_user_model()

def fix_names():
    # 1. Atualizar farmácia do usuário admin/teste
    try:
        user = User.objects.get(email='farmacia@teste.com')
        if hasattr(user, 'farmacia'):
            f = user.farmacia
            print(f"Farmácia atual: {f.nome}")
            f.nome = "Farmácia GestorFarma" # Nome Oficial
            f.endereco = "Av. 24 de Julho, Maputo"
            f.nuit = "400123456"
            f.save()
            print(f"Farmácia atualizada para: {f.nome}")
        else:
            print("Usuário farmacia@teste.com não tem farmácia vinculada.")
    except User.DoesNotExist:
        print("Usuário farmacia@teste.com não encontrado.")

    # 2. Renomear quaisquer outras farmácias 'Auto-Criada' se existirem
    outras = Farmacia.objects.filter(nome__icontains="Auto-Criada")
    for f in outras:
        f.nome = "Farmácia Filial Centro"
        f.save()
        print(f"Farmácia {f.id} renomeada.")

if __name__ == '__main__':
    fix_names()
