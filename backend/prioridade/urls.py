from django.urls import path
from .views import (
    ListarPlanosView,
    MinhaAssinaturaView,
    CriarAssinaturaView,
    HistoricoAssinaturasView
)

urlpatterns = [
    path('planos/', ListarPlanosView.as_view(), name='listar-planos'),
    path('minha-assinatura/', MinhaAssinaturaView.as_view(), name='minha-assinatura'),
    path('assinar/', CriarAssinaturaView.as_view(), name='criar-assinatura'),
    path('historico/', HistoricoAssinaturasView.as_view(), name='historico-assinaturas'),
]
