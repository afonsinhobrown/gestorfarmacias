import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def check_xarope():
    from produtos.models import Produto
    print(f"--- VERIFICANDO BANCO ATUAL: {settings.DATABASES['default']['HOST']} ---")
    
    # Procura por 'XAROPE' (case insensitive)
    produtos = Produto.objects.filter(nome__icontains='XAROPE')
    
    if produtos.exists():
        print(f"\n[ENCONTRADO] O produto 'XAROPE' está neste banco!")
        for p in produtos:
            print(f"- ID: {p.id} | Nome: {p.nome} | Criado em: {p.data_criacao}")
    else:
        print(f"\n[NÃO ENCONTRADO] O produto 'XAROPE' NÃO consta neste banco.")
        print("Isso indica que você salvou em OUTRO banco de dados.")

if __name__ == "__main__":
    check_xarope()
