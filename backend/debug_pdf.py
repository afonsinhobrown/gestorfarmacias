import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from pedidos.views import RelatorioVendasPDFView
from django.contrib.auth import get_user_model

User = get_user_model()
try:
    user = User.objects.filter(tipo_usuario='FARMACIA').first()
    if not user:
        print("Erro: Nenhum usuário farmácia encontrado.")
        exit(1)
        
    print(f"Testando PDF com usuário: {user.email}")
    if hasattr(user, 'farmacia'):
        print(f"Farmácia: {user.farmacia.nome}, IVA: {user.farmacia.percentual_iva}")

    factory = APIRequestFactory()
    request = factory.get('/pedidos/relatorios/vendas-pdf/')
    force_authenticate(request, user=user)

    view = RelatorioVendasPDFView.as_view()
    
    response = view(request)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code != 200:
        print("Erro capturado:")
        # Tentar imprimir conteúdo se for JSON, mas é PDF blob
        print("Response content type:", response['Content-Type'])
    else:
        print("PDF gerado com sucesso (Tamanho: bytes)")
        print(len(response.content))

except Exception as e:
    print("Traceback capturado:")
    import traceback
    traceback.print_exc()
