import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def check_user():
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    email = "farmacia@gestorfarma.com"
    print(f"--- Verificando usuário: {email} ---")
    print(f"Banco conectado: {settings.DATABASES['default']['HOST']}")
    
    try:
        user = User.objects.get(email=email)
        print(f"[ENCONTRADO] O usuário existe!")
        print(f"ID: {user.id}")
        print(f"Is Active: {user.is_active}")
        
        # Opcional: Redefinir senha para garantir
        # user.set_password('farmacia123')
        # user.save()
        # print("Senha redefinida para 'farmacia123' para garantir.")
        
    except User.DoesNotExist:
        print(f"[NÃO ENCONTRADO] O usuário {email} NÃO existe neste banco de dados novo.")
        print("Como mudamos de banco, você precisa criar este usuário novamente ou rodar o seed de dados.")

if __name__ == "__main__":
    check_user()
