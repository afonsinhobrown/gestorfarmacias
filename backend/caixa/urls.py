from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaixaViewSet, SessaoCaixaView, MovimentoCaixaViewSet
from .admin_views import AdminAuditoriaCaixaView

router = DefaultRouter()
router.register('terminais', CaixaViewSet, basename='caixa-terminais')
router.register('movimentos', MovimentoCaixaViewSet, basename='caixa-movimentos')

urlpatterns = [
    path('', include(router.urls)),
    path('sessao/', SessaoCaixaView.as_view(), name='caixa-sessao-status'),
    path('sessao/<str:action>/', SessaoCaixaView.as_view(), name='caixa-sessao-action'),
    path('auditoria/', AdminAuditoriaCaixaView.as_view(), name='caixa-auditoria'),
]
