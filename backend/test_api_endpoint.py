import requests
import sys

try:
    # Tenta acessar a URL sem autenticação
    # Esperamos 401 (Unauthorized) se a URL existir, ou 404 se não existir.
    url = 'http://localhost:8000/api/v1/produtos/meu-estoque/'
    print(f"Testando GET {url}...")
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 404:
        print("ERRO: URL não encontrada pelo Django!")
    elif response.status_code == 401:
        print("SUCESSO: URL existe e está protegida (como esperado).")
    else:
        print(f"Resposta inesperada: {response.status_code}")

except Exception as e:
    print(f"Erro ao conectar: {e}")
