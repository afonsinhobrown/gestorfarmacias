from django.urls import path
from .views import VerificarStatusCadastroView
from .delivery_views import EntregasDisponiveisView, AceitarEntregaView, MinhasEntregasView

urlpatterns = [
    path('verificar-status/', VerificarStatusCadastroView.as_view(), name='verificar_status_cadastro'),
    path('disponiveis/', EntregasDisponiveisView.as_view(), name='entregas_disponiveis'),
    path('aceitar/<int:pedido_id>/', AceitarEntregaView.as_view(), name='aceitar_entrega'),
    path('minhas/', MinhasEntregasView.as_view(), name='minhas_entregas'),
]
