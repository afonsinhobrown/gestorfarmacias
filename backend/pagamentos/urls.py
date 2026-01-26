from django.urls import path
from .views import (
    PagamentoListView, PagamentoDetailView, PagamentoCreateView,
    AtualizarStatusPagamentoView, PagamentosStatisticsView,
    CartaoCreditoListView, ReembolsoListView
)

urlpatterns = [
    path('', PagamentoListView.as_view(), name='pagamento_list'),
    path('criar/', PagamentoCreateView.as_view(), name='pagamento_create'),
    path('stats/', PagamentosStatisticsView.as_view(), name='pagamento_stats'),
    path('<int:pk>/', PagamentoDetailView.as_view(), name='pagamento_detail'),
    path('<int:pk>/status/', AtualizarStatusPagamentoView.as_view(), name='pagamento_status'),
    path('cartoes/', CartaoCreditoListView.as_view(), name='cartao_list'),
    path('reembolsos/', ReembolsoListView.as_view(), name='reembolso_list'),
]
