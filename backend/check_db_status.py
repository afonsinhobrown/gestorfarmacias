import subprocess

# Definições
DBS = {
    "yluxubudoxkpmsznkbja (North)": "postgresql://postgres.yluxubudoxkpmsznkbja:pandorabox5229@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    "jikulbmlvksieyeoxdcq (West)": "postgresql://postgres.jikulbmlvksieyeoxdcq:pandorabox5229@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
}

def check_db(name, url):
    print(f"\n--- Checking {name} ---")
    try:
        # Tenta listar tabelas (contagem)
        # O comando SQL conta tabelas na schema public
        cmd = f'psql "{url}" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = \'public\';"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"LIGAÇÃO SUCESSO! Resultado:\n{result.stdout.strip()}")
        else:
            print(f"FALHA NA LIGAÇÃO. Erro:\n{result.stderr.strip()}")
            
    except Exception as e:
        print(f"Erro de execução: {e}")

if __name__ == "__main__":
    print("Verificando qual banco está cheio (Antigo) e qual está vazio (Novo)...")
    for name, url in DBS.items():
        check_db(name, url)
