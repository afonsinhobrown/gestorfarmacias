import os
import subprocess
import sys
import time

# Configuração FIXA (substitua aqui se precisar)
# Configuração: Supabase Antigo (Origem) -> Supabase Novo (Destino)
# Usando porta 5432 (Session Mode) para compatibilidade com pg_dump
OLD_DB_URL = "postgresql://postgres.yluxubudoxkpmsznkbja:pandorabox5229@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"
NEW_DB_URL = "postgresql://postgres.jikulbmlvksieyeoxdcq:pandorabox5229@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

BACKUP_FILE = "backup_completo.sql"

def run_command(command, description):
    """Executa um comando no shell e exibe progresso."""
    print(f"\n>>> {description}...")
    try:
        subprocess.run(command, shell=True, check=True)
        print(f"v Sucesso: {description}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"X Erro: {description} falhou.")
        return False

def main():
    print("###################################################")
    print("#           MIGRAÇÃO SUPABASE -> SUPABASE          #")
    print("###################################################")
    print(f"Origem: {OLD_DB_URL}")
    print(f"Destino: {NEW_DB_URL}")
    print("---------------------------------------------------")

    # 1. Exportar Banco Antigo (pg_dump)
    # --clean: inclui comandos para limpar o banco de destino antes de criar
    # --if-exists: previne erros ao limpar
    # --no-owner --no-privileges: evita problemas de permissão entre projetos diferentes
    export_cmd = f'pg_dump "{OLD_DB_URL}" --clean --if-exists --no-owner --no-privileges -f {BACKUP_FILE}'
    
    if not run_command(export_cmd, "Exportando banco antigo (pg_dump)"):
        sys.exit(1)

    print(f"Backup gerado: {BACKUP_FILE}")
    time.sleep(2)

    # 2. Importar no Banco Novo (psql)
    import_cmd = f'psql "{NEW_DB_URL}" -f {BACKUP_FILE}'
    
    if not run_command(import_cmd, "Importando para o novo banco (psql)"):
        sys.exit(1)

    print("\n###################################################")
    print("#              MIGRAÇÃO CONCLUÍDA!                #")
    print("###################################################")
    
    # 3. Atualizar .env (Opcional, mas útil)
    print("Lembre-se de atualizar o arquivo .env com a nova URL se ainda não o fez.")

if __name__ == "__main__":
    main()
