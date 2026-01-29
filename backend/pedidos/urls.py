from django.urls import path
from .views import (
    PedidoCreateView, PedidoListView, 
    PedidoDetailView, AtualizarStatusPedidoView,
    VendaBalcaoView, DashboardStatsView, MeusPedidosView,
    RelatorioVendasPDFView, AnularPedidoView, ExtratoVendasView, ComissaoView
)

urlpatterns = [
    path('', PedidoListView.as_view(), name='pedido_list'),
    path('novo/', PedidoCreateView.as_view(), name='pedido_create'),
    path('extrato/', ExtratoVendasView.as_view(), name='extrato-vendas'),
    path('comissoes/', ComissaoView.as_view(), name='comissoes'),
    path('venda-balcao/', VendaBalcaoView.as_view(), name='venda-balcao'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('meus-pedidos/', MeusPedidosView.as_view(), name='meus-pedidos'),
    path('<int:pk>/', PedidoDetailView.as_view(), name='pedido_detail'),
    path('<int:pk>/status/', AtualizarStatusPedidoView.as_view(), name='pedido_status_update'),
    path('<int:pk>/anular/', AnularPedidoView.as_view(), name='pedido-anular'),
    path('relatorios/vendas-pdf/', RelatorioVendasPDFView.as_view(), name='vendas-pdf'),
]
