import socket

def test_connection(host, port):
    print(f"Testando conexão para {host}:{port}...")
    try:
        sock = socket.create_connection((host, port), timeout=5)
        print("✅ CONEXÃO BEM SUCEDIDA!")
        sock.close()
        return True
    except Exception as e:
        print(f"❌ FALHA: {e}")
        # Dica para usuário PythonAnywhere
        if "Connection refused" in str(e) or "Network is unreachable" in str(e):
            print("   -> Isso geralmente indica bloqueio de firewall (Conta Grátis do PythonAnywhere).")
        return False

if __name__ == "__main__":
    host = "aws-1-eu-west-1.pooler.supabase.com"
    
    print("--- Teste de Portas Supabase ---")
    test_connection(host, 5432)
    test_connection(host, 6543)
    
    # Teste IPv4 direto (às vezes ajuda a diagnosticar DNS)
    # IP retornado no seu erro anterior: 18.202.64.2
    print("\n--- Teste direto IP (18.202.64.2) ---")
    test_connection("18.202.64.2", 5432)
    test_connection("18.202.64.2", 6543)
