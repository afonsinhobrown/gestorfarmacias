import urllib.request
import urllib.error

url = 'http://localhost:8000/api/v1/produtos/meu-estoque/'
print(f"Testando GET {url}...")

try:
    with urllib.request.urlopen(url) as response:
        print(f"Status: {response.status}")
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    if e.code == 404:
        print("ERRO: URL nao encontrada!")
    elif e.code == 401 or e.code == 403:
        print("SUCESSO: URL existe (Autenticacao requerida).")
except Exception as e:
    print(f"Erro de Conexao: {e}")
