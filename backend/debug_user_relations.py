import os
import django
from django.conf import settings
from django.contrib.auth import get_user_model

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def debug_user_relations():
    User = get_user_model()
    try:
        user = User.objects.get(email="farmacia@gestorfarma.com")
        print(f"--- Diagnóstico do Usuário: {user.email} (ID: {user.id}) ---")
        
        # 1. Verificar tipo de usuário
        print(f"Tipo de Usuário: {user.tipo_usuario}")
        
        # 2. Verificar Relação Farmácia
        if hasattr(user, 'farmacia'):
            print(f"[OK] Tem Farmácia associada: {user.farmacia.nome} (ID: {user.farmacia.id})")
        else:
            print(f"[ALERTA] Usuário SEM perfil de Farmácia! (Isso quebra o login se o frontend esperar farmácia)")
            
        # 3. Verificar Grupos/Permissões (se relevante)
        print(f"Grupos: {list(user.groups.values_list('name', flat=True))}")
        
    except User.DoesNotExist:
        print("[ERRO] Usuário não encontrado.")
    except Exception as e:
        print(f"[ERRO NO DIAGNÓSTICO]: {e}")

if __name__ == "__main__":
    debug_user_relations()
