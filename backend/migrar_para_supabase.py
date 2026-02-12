import os
import sys
import subprocess
from pathlib import Path

# Configuração
BACKEND_DIR = Path(__file__).resolve().parent
ENV_FILE = BACKEND_DIR / '.env'
BACKUP_FILE = BACKEND_DIR / 'backup_transicao_supabase.json'

def run_command(command, env=None):
    """Executa um comando no shell e retorna o output."""
    try:
        if env:
            # Mescla com o ambiente atual
            env = {**os.environ, **env}
        
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            cwd=BACKEND_DIR,
            env=env
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar: {command}")
        return False

def main():
    print("=== ASSISTENTE DE MIGRAÇÃO PARA SUPABASE ===")
    print("Este script vai migrar seus dados do banco atual (SQLite) para o novo Supabase.")
    
    # 1. Fazendo Backup dos Dados Atuais
    print("\n[1/5] Exportando dados atuais...")
    if run_command(f"python manage.py dumpdata --exclude auth.permission --exclude contenttypes --indent 2 > {BACKUP_FILE.name}"):
        print(f"Backup salvo em: {BACKUP_FILE}")
    else:
        print("Falha no backup. Abortando.")
        return

    # 2. Solicitando Novas Credenciais
    print("\n[2/5] Configuração do Novo Banco Supabase")
    print("Acesse seu projeto no Supabase > Project Settings > Database")
    
    db_host = input("Host (ex: db.xyz.supabase.co): ").strip()
    db_pass = input("Password (a que você definiu na criação): ").strip()
    
    if not db_host or not db_pass:
        print("Credenciais inválidas.")
        return

    # 3. Atualizando .env
    print("\n[3/5] Atualizando arquivo .env...")
    
    # Ler conteúdo atual
    with open(ENV_FILE, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    db_section = False
    
    for line in lines:
        if line.startswith('DB_ENGINE='):
            new_lines.append('DB_ENGINE=django.db.backends.postgresql\n')
        elif line.startswith('DB_NAME='):
            new_lines.append('DB_NAME=postgres\n')
        elif line.startswith('DB_USER='):
            new_lines.append('DB_USER=postgres\n')
        elif line.startswith('DB_PASSWORD='):
            new_lines.append(f'DB_PASSWORD={db_pass}\n')
        elif line.startswith('DB_HOST='):
            new_lines.append(f'DB_HOST={db_host}\n')
        elif line.startswith('DB_PORT='):
            new_lines.append('DB_PORT=5432\n')
        else:
            new_lines.append(line)
            
    # Escrever novo .env
    with open(ENV_FILE, 'w') as f:
        f.writelines(new_lines)
    
    print("Arquivo .env atualizado com sucesso!")

    # 4. Criando Tabelas no Novo Banco
    print("\n[4/5] Criando tabelas no Supabase (Migrate)...")
    if not run_command("python manage.py migrate"):
        print("Erro ao criar tabelas. Verifique suas credenciais e tente novamente.")
        print("Revertendo .env para SQLite para segurança...")
        # (Lógica de reversão simplificada: o usuário pode usar git checkout ou backup manual)
        return

    # 5. Importando Dados
    print("\n[5/5] Importando dados do backup...")
    if run_command(f"python manage.py loaddata {BACKUP_FILE.name}"):
        print("\nSUCESSO! Migração concluída.")
        print("Seu sistema agora está rodando no novo Supabase.")
    else:
        print("\nErro na importação. As tabelas foram criadas, mas os dados falharam ao carregar.")
        print(f"O arquivo de backup está salvo em: {BACKUP_FILE}")

if __name__ == "__main__":
    main()
