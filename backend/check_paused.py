import subprocess
import sys

# URL do Banco Antigo (Supabase Norte - yluxubudoxkpmsznkbja)
DB_URL = "postgresql://postgres.yluxubudoxkpmsznkbja:pandorabox5229@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"

def check_status():
    print(f"--- Testando Conexão com Supabase Antigo ({DB_URL.split('@')[1]}) ---")
    print("Tentando conectar...")
    
    # Tenta rodar um comando simples (SELECT 1) com timeout de 10s
    try:
        # Usando psql para testar
        cmd = ['psql', DB_URL, '-c', 'SELECT 1;', '-t']
        
        # Executa com timeout
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        
        if result.returncode == 0:
            print("\n[ONLINE] O Banco está ATIVO e respondendo!")
            print("Saída:", result.stdout.strip())
        else:
            print("\n[ERRO] Não foi possível conectar.")
            print("Mensagem:", result.stderr.strip())
            
            if "password authentication failed" in result.stderr:
                print("-> Diagnóstico: O banco está ONLINE, mas a SENHA está incorreta.")
            elif "timeout" in result.stderr.lower() or "refused" in result.stderr.lower():
                print("-> Diagnóstico: Possível PAUSA ou Erro de Rede.")
            elif "project is paused" in result.stderr.lower(): # Supabase às vezes retorna isso
                print("-> Diagnóstico: PROJETO PAUSADO.")
                
    except subprocess.TimeoutExpired:
        print("\n[TIMEOUT] A conexão demorou muito.")
        print("-> Diagnóstico: O projeto pode estar PAUSADO (Cold Start demora) ou bloqueado.")
    except Exception as e:
        print(f"\n[FALHA] Erro ao executar: {e}")

if __name__ == "__main__":
    check_status()
