from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FuncionarioViewSet, FolhaPagamentoViewSet

router = DefaultRouter()
router.register(r'funcionarios', FuncionarioViewSet, basename='funcionario')
router.register(r'folha-pagamento', FolhaPagamentoViewSet, basename='folha-pagamento')

urlpatterns = [
    path('', include(router.urls)),
]
