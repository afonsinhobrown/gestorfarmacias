from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrdemCompraViewSet

router = DefaultRouter()
router.register('ordens', OrdemCompraViewSet, basename='compras-ordens')

urlpatterns = [
    path('', include(router.urls)),
]
