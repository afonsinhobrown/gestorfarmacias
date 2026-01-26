import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from farmacias.analytics_views import AnalyticsReportView
from django.contrib.auth import get_user_model

User = get_user_model()
try:
    user = User.objects.filter(tipo_usuario='FARMACIA').first()
    print(f"Testando com usuário: {user.email}")

    factory = APIRequestFactory()
    request = factory.get('/farmacias/dashboard/report/?periodo=30')
    force_authenticate(request, user=user) # Autenticação forçada

    view = AnalyticsReportView.as_view()
    
    # Executar
    try:
        response = view(request)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print("Erro na resposta:")
            print(response.data)
    except Exception as e:
        import traceback
        traceback.print_exc()

except Exception as e:
    import traceback
    traceback.print_exc()
