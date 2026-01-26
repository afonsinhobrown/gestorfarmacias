import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from farmacias.views import NotificacaoListView
from django.contrib.auth import get_user_model

User = get_user_model()
try:
    user = User.objects.filter(tipo_usuario='FARMACIA').first()
    if not user:
        print("Erro: Nenhum usuário farmácia encontrado.")
        exit(1)
        
    print(f"Testando com usuário: {user.email}")

    factory = APIRequestFactory()
    request = factory.get('/farmacias/notificacoes/')
    force_authenticate(request, user=user)

    view = NotificacaoListView.as_view()
    
    response = view(request)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code != 200:
        print("Erro capturado no response:")
        print(response.data)

except Exception as e:
    print("Traceback capturado:")
    import traceback
    traceback.print_exc()
