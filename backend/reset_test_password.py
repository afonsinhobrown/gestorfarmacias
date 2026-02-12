import os
import django
from django.conf import settings
from django.contrib.auth import get_user_model

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def reset_password():
    User = get_user_model()
    email = "farmacia@gestorfarma.com"
    nova_senha = "farmacia123"
    
    try:
        user = User.objects.get(email=email)
        user.set_password(nova_senha)
        user.save()
        print(f"[SUCESSO] Senha de '{email}' redefinida para '{nova_senha}'.")
        print("Tente fazer login agora.")
    except User.DoesNotExist:
        print(f"[ERRO] Usuário {email} não encontrado.")

if __name__ == "__main__":
    reset_password()
