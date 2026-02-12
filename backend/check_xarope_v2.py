import os
import django
import sqlite3
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def check_xarope():
    # 1. Verificar Banco Novo (Configurado no Django)
    print(f"--- 1. VERIFICANDO BANCO ATUAL (Django): {settings.DATABASES['default']['HOST']} ---")
    
    try:
        from produtos.models import Produto
        produtos = Produto.objects.filter(nome__icontains='XAROPE')
        if produtos.exists():
            print(f"[ENCONTRADO NO NOVO] O produto 'XAROPE' está aqui!")
        else:
            print(f"[NÃO ENCONTRADO] Não está no Novo Supabase.")
    except Exception as e:
        print(f"[ERRO] Falha ao verificar Novo: {e}")

    # 2. Verificar SQLite Local (Caso tenha salvo localmente)
    print(f"\n--- 2. VERIFICANDO SQLite LOCAL (db.sqlite3) ---")
    db_path = os.path.join(settings.BASE_DIR, 'db.sqlite3')
    
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            # Tenta achar a tabela (nome pode variar dependendo da migração)
            tables = ['produtos_produto', 'medicamentos'] # Tenta nomes comuns
            found = False
            for table in tables:
                try:
                    cursor.execute(f"SELECT nome FROM {table} WHERE nome LIKE '%XAROPE%'")
                    rows = cursor.fetchall()
                    if rows:
                        print(f"[ENCONTRADO NO SQLITE] O produto 'XAROPE' está no arquivo db.sqlite3 local!")
                        found = True
                        break
                except sqlite3.OperationalError:
                    continue # Tabela não existe
            
            if not found:
                print(f"[NÃO ENCONTRADO] Não está no SQLite local.")
            conn.close()
        except Exception as e:
            print(f"[ERRO] Falha ao ler SQLite: {e}")
    else:
        print("Arquivo db.sqlite3 não encontrado.")

if __name__ == "__main__":
    check_xarope()
