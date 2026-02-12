import os
import django
from django.conf import settings
from rest_framework.test import APIClient

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_login():
    client = APIClient()
    url = '/api/v1/auth/login/'
    data = {
        'email': 'farmacia@gestorfarma.com',
        'password': 'farmacia123'
    }
    
    print(f"--- SIMULANDO LOGIN para {data['email']} ---")
    try:
        response = client.post(url, data, format='json')
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("[SUCESSO] Login funcionou! Token recebido.")
        else:
            print(f"[FALHA] Erro no login: {response.status_code}")
            print(f"Conteúdo da resposta: {response.content.decode()}")
            
    except Exception as e:
        import traceback
        print("\n[ERRO FATAL EXCEÇÃO]")
        traceback.print_exc()

if __name__ == "__main__":
    test_login()
