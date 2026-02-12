import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def check_db():
    print("--- DIAGNÓSTICO DE CONEXÃO ---")
    db_settings = settings.DATABASES['default']
    
    print(f"ENGINE: {db_settings['ENGINE']}")
    print(f"NAME: {db_settings['NAME']}")
    print(f"HOST: {db_settings['HOST']}")
    print(f"PORT: {db_settings['PORT']}")
    print(f"USER: {db_settings['USER']}")
    
    # Check connection
    from django.db import connection
    try:
        connection.ensure_connection()
        print("\n[SUCESSO] Conexão estabelecida!")
        print(f"Host real conectado: {connection.settings_dict['HOST']}")
        
        # Count some data
        from accounts.models import User
        count = User.objects.count()
        print(f"Total de Usuários no banco: {count}")
        
    except Exception as e:
        print(f"\n[ERRO] Falha ao conectar: {e}")

if __name__ == "__main__":
    check_db()
