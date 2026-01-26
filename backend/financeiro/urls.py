from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DespesaViewSet, CategoriaDespesaViewSet

router = DefaultRouter()
router.register(r'despesas', DespesaViewSet, basename='despesa')
router.register(r'categorias', CategoriaDespesaViewSet, basename='categoria-despesa')

urlpatterns = [
    path('', include(router.urls)),
]
