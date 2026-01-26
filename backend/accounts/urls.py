from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, UserDetailView, CustomTokenObtainPairView, 
    FarmaciaRegistroView, MotoboyRegistroView, ListarClientesView
)
from .admin_views import AdminStatsView, EntregadoresPendentesView, AprovarEntregadorView, RejeitarEntregadorView, AdminUserListView

urlpatterns = [
    path('register/cliente/', RegisterView.as_view(), name='cliente_register'),
    path('register/farmacia/', FarmaciaRegistroView.as_view(), name='farmacia_register'),
    path('register/motoboy/', MotoboyRegistroView.as_view(), name='motoboy_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='auth_user_detail'),
    path('clientes/', ListarClientesView.as_view(), name='lista_clientes'),
]

# Rotas administrativas
admin_urlpatterns = [
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/entregadores/pendentes/', EntregadoresPendentesView.as_view(), name='admin_entregadores_pendentes'),
    path('admin/entregadores/<int:pk>/aprovar/', AprovarEntregadorView.as_view(), name='admin_aprovar_entregador'),
    path('admin/entregadores/<int:pk>/rejeitar/', RejeitarEntregadorView.as_view(), name='admin_rejeitar_entregador'),
]

urlpatterns += admin_urlpatterns
