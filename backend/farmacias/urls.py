from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    FarmaciaListView, FarmaciaDetailView, FarmaciaAvaliacaoCreateView,
    NotificacaoListView, NotificacaoMarcarLidaView, MinhaFarmaciaView
)
from .analytics_views import DashboardStatsView, AnalyticsReportView
from .client_views import ClientFarmaciaListView, ClientFarmaciaProdutosView
from .admin_views import AdminFarmaciaViewSet, AdminGibagioViewSet, AdminLicencaViewSet

router = DefaultRouter()
router.register('admin/gestao', AdminFarmaciaViewSet, basename='admin_farmacias')
router.register('admin/gibagios', AdminGibagioViewSet, basename='admin_gibagios')
router.register('admin/licencas', AdminLicencaViewSet, basename='admin_licencas')

urlpatterns = [
    path('', FarmaciaListView.as_view(), name='farmacia_list'),
    path('portal/', ClientFarmaciaListView.as_view(), name='client_farmacia_list'),
    path('portal/<int:farmacia_id>/produtos/', ClientFarmaciaProdutosView.as_view(), name='client_farmacia_produtos'),
    path('me/', MinhaFarmaciaView.as_view(), name='minha_farmacia'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/report/', AnalyticsReportView.as_view(), name='dashboard_report'),
    path('notificacoes/', NotificacaoListView.as_view(), name='notificacao_list'),
    path('notificacoes/ler/', NotificacaoMarcarLidaView.as_view(), name='notificacao_ler_todas'),
    path('notificacoes/ler/<int:pk>/', NotificacaoMarcarLidaView.as_view(), name='notificacao_ler'),
    path('<int:pk>/', FarmaciaDetailView.as_view(), name='farmacia_detail'),
    path('<int:pk>/avaliar/', FarmaciaAvaliacaoCreateView.as_view(), name='farmacia_avaliar'),
] + router.urls
