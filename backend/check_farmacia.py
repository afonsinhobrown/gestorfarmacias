import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from farmacias.models import Farmacia

User = get_user_model()

try:
    user = User.objects.get(email='farmacia@teste.com')
    print(f"Usuário encontrado: {user}")
    
    # Verifica se já existe
    if hasattr(user, 'farmacia'):
        f = user.farmacia
        print(f"Farmácia vinculada: {f.nome} (ID: {f.id})")
        
        # Corrige dados se necessário
        changed = False
        if f.latitude is None:
            f.latitude = -25.9692
            changed = True
        if f.longitude is None:
            f.longitude = 32.5732
            changed = True
            
        if changed:
            f.save()
            print("Dados de localização corrigidos!")
            
    else:
        print("Usuário NÃO tem farmácia vinculada! Criando agora...")
        f = Farmacia.objects.create(
            usuario=user,
            nome='Farmácia Auto-Criada',
            telefone_principal='840000000',
            endereco='Rua Debug',
            cidade='Maputo',
            provincia='Maputo',
            latitude=-25.9692,
            longitude=32.5732
        )
        print(f"Farmácia criada com sucesso: {f}")

except User.DoesNotExist:
    print("Usuário farmacia@teste.com não existe!")
except Exception as e:
    print(f"Erro: {e}")
