from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
import sys

print("CARREGANDO CONFIG.URLS...", file=sys.stderr)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/farmacias/', include('farmacias.urls')),
    path('api/v1/produtos/', include('produtos.urls')), 
    path('api/v1/pedidos/', include('pedidos.urls')),
    path('api/v1/entregas/', include('entregas.urls')),
    path('api/v1/pagamentos/', include('pagamentos.urls')),
    path('api/v1/clientes/', include('clientes.urls')),
    path('api/v1/fornecedores/', include('fornecedores.urls')),
    path('api/v1/financeiro/', include('financeiro.urls')),
    path('api/v1/rh/', include('rh.urls')),
    path('api/v1/prioridade/', include('prioridade.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

print("URLS CARREGADAS COM SUCESSO.", file=sys.stderr)
