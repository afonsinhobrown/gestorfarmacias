import os
import django
import sys
from django.conf import settings

# Setup robusto do Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

def teste_login_hardcore():
    email = 'farmacia@gestorfarma.com'
    senha = 'farmacia123'
    
    print(f"--- TESTE DE LOGIN: {email} ---")
    
    try:
        # 1. Tentar autenticar
        user = authenticate(email=email, password=senha)
        
        if user:
            print(f"[SUCESSO] Usuário autenticado: {user}")
            
            # 2. Tentar gerar Token (onde costuma falhar se faltar dados)
            try:
                refresh = RefreshToken.for_user(user)
                access = str(refresh.access_token)
                print(f"[SUCESSO] Token gerado sem erros!")
                print(f"Access Token: {access[:20]}...")
            except Exception as e:
                print(f"[ERRO AO GERAR TOKEN]: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("[FALHA] Credenciais inválidas (authenticate retornou None).")
            
    except Exception as e:
        print(f"[ERRO CRÍTICO NO LOGIN]: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    teste_login_hardcore()
