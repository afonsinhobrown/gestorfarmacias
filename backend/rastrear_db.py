import os
import django
from django.conf import settings
from django.db import connection

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def rastrear_conexao():
    print("--- INICIANDO RASTREAMENTO DE CONEXÃO ---")
    
    # 1. Verificar configuração carregada na memória
    db_conf = settings.DATABASES['default']
    print(f"Configuração Django (settings.py):")
    print(f"  ENGINE: {db_conf['ENGINE']}")
    print(f"  NAME: {db_conf['NAME']}")
    print(f"  HOST: {db_conf['HOST']}")
    print(f"  USER: {db_conf['USER']}")
    
    # 2. Tentar criar um registro de teste
    try:
        from produtos.models import CategoriaProduto
        
        print("\nTentando criar Categoria de Teste 'RASTREAMENTO_001'...")
        cat = CategoriaProduto.objects.create(nome="RASTREAMENTO_001", descricao="Teste de conexão")
        print(f"[SUCESSO] Categoria criada com ID: {cat.id}")
        
        # 3. Inspecionar a conexão REAL usada
        print("\nInspecionando conexão ativa:")
        with connection.cursor() as cursor:
            # Obter informações do servidor PostgreSQL
            cursor.execute("SELECT inet_server_addr(), inet_server_port(), current_database(), current_user;")
            row = cursor.fetchone()
            
            print(f"  IP do Servidor: {row[0]}")
            print(f"  Porta: {row[1]}")
            print(f"  Banco de Dados: {row[2]}")
            print(f"  Usuário Logado: {row[3]}")
            print("\n-> SE O IP NÃO FOR O ESPERADO, ESTAMOS NO BANCO ERRADO.")
            
            # Limpeza
            cat.delete()
            print("\n[LIMPEZA] Categoria de teste removida.")
            
    except Exception as e:
        print(f"\n[FALHA] Não foi possível gravar no banco: {e}")
        # Se falhar, tenta diagnosticar o erro
        if "read-only" in str(e):
            print("-> Diagnóstico: O banco está em modo SOMENTE LEITURA (Réplica?).")
        elif "connection refused" in str(e):
            print("-> Diagnóstico: Conexão recusada (Banco offline/pausado?).")

if __name__ == "__main__":
    rastrear_conexao()
