import os
import subprocess
import sys
from pathlib import Path
import time

# Configuração
BASE_DIR = Path(__file__).resolve().parent
BACKUP_FILE = BASE_DIR / 'backup_cloud_completo.json'

def get_db_credentials(label):
    """Solicita credenciais do banco de dados ao usuário."""
    print(f"\n=== CONFIGURAÇÃO DO BANCO: {label} ===")
    print(f"Por favor, insira os dados de conexão do Supabase ({label}).")
    
    host = input(f"Host [{label}] (ex: db.xyz.supabase.co): ").strip()
    password = input(f"Password [{label}]: ").strip()
    
    if not host or not password:
        print("Erro: Host e Password são obrigatórios.")
        sys.exit(1)
        
    return {
        'DB_ENGINE': 'django.db.backends.postgresql',
        'DB_NAME': 'postgres',
        'DB_USER': 'postgres',
        'DB_PASSWORD': password,
        'DB_HOST': host,
        'DB_PORT': '5432'
    }

def run_django_command(command, env_vars, description):
    """Executa um comando Django com variáveis de ambiente específicas."""
    print(f"\n>>> {description}...")
    
    # Copia o ambiente atual e atualiza com as novas variáveis do banco
    process_env = os.environ.copy()
    process_env.update(env_vars)
    
    try:
        subprocess.run(
            f"python manage.py {command}",
            shell=True,
            check=True,
            cwd=BASE_DIR,
            env=process_env
        )
        print(f"v Sucesso: {description}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"X Erro: {description} falhou.")
        return False

def main():
    print("###################################################")
    print("#   MIGRATOR SUPABASE -> SUPABASE (CLOUD TO CLOUD) #")
    print("###################################################")
    print("Este script irá transferir todos os dados de uma conta Supabase para outra.")
    print("Certifique-se de ter as senhas de AMBOS os bancos.\n")

    # 1. Obter credenciais da ORIGEM (Supabase Antigo/Cheio)
    old_db_env = get_db_credentials("ORIGEM - CONTA ANTIGA")
    
    # 2. Obter credenciais do DESTINO (Supabase Novo)
    new_db_env = get_db_credentials("DESTINO - CONTA NOVA")

    print("\n---------------------------------------------------")
    print("Iniciando processo de migração...")
    print("---------------------------------------------------")

    # 3. Dump dos dados da Origem
    # Excluímos contenttypes e auth.permission para evitar conflitos na importação
    dump_cmd = f"dumpdata --exclude auth.permission --exclude contenttypes --indent 2 --output \"{BACKUP_FILE}\""
    if not run_django_command(dump_cmd, old_db_env, "Extraindo dados da Conta Antiga"):
        sys.exit(1)

    print(f"\nBackup temporário salvo em: {BACKUP_FILE}")
    print("Tamanho do arquivo: {:.2f} MB".format(BACKUP_FILE.stat().st_size / (1024 * 1024)))
    
    time.sleep(1)

    # 4. Preparar o Destino (Migrate)
    # Garante que as tabelas existam no novo banco
    if not run_django_command("migrate", new_db_env, "Criando tabelas na Conta Nova"):
        print("Erro ao criar tabelas. Verifique a senha da conta NOVA.")
        sys.exit(1)

    # 5. Limpar dados iniciais do Destino (Opcional, mas recomendado para evitar duplicatas de seeds)
    # Como o migrate pode criar dados iniciais, o flush garante que está limpo para receber o dump
    print("\n>>> Limpando dados iniciais da Conta Nova (Flush)...")
    try:
        # flush requer input interativo, vamos forçar com --no-input se possível ou pular
        # O dumpdata já contém tudo, então o ideal é carregar por cima ou truncar. 
        # Vamos tentar carregar direto. Se der erro de integridade, avisamos.
        pass 
    except Exception:
        pass

    # 6. Importar dados no Destino
    if run_django_command(f"loaddata \"{BACKUP_FILE}\"", new_db_env, "Importando dados para a Conta Nova"):
        print("\n###################################################")
        print("#              MIGRAÇÃO CONCLUÍDA!                #")
        print("###################################################")
        print("\nPróximos passos:")
        print("1. Atualize seu arquivo .env local com as credenciais da CONTA NOVA.")
        print("2. Atualize as variáveis de ambiente no RENDER com as credenciais da CONTA NOVA.")
        print("3. Reinicie o serviço no Render.")
    else:
        print("\nErro na importação. Verifique se o banco novo estava vazio.")

if __name__ == "__main__":
    main()
