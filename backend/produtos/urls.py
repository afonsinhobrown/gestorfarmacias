from django.urls import path
from .views import (
    CategoriaListView, ProdutoListView, ProdutoDetailView, 
    ProdutoDisponibilidadeView, EstoqueFarmaciaListView,
    BuscaGlobalView
)

urlpatterns = [
    # Gestão (Privado para Farmácias)
    path('meu-estoque/', EstoqueFarmaciaListView.as_view(), name='farmacia_estoque_list'),

    # Catálogo (Público)
    path('categorias/', CategoriaListView.as_view(), name='categoria_list'),
    path('catalogo/', ProdutoListView.as_view(), name='produto_list'),
    path('catalogo/busca/', BuscaGlobalView.as_view(), name='produto_busca_global'),
    path('catalogo/<int:pk>/', ProdutoDetailView.as_view(), name='produto_detail'),
    path('catalogo/<int:pk>/disponibilidade/', ProdutoDisponibilidadeView.as_view(), name='produto_disponibilidade'),
]

from rest_framework.routers import DefaultRouter
from .views import EntradaEstoqueViewSet, AjusteEstoqueView, EstoqueHistoricoView, ReajustePrecoView

router = DefaultRouter()
router.register(r'entradas', EntradaEstoqueViewSet, basename='entrada-estoque')

urlpatterns += [
    path('ajuste/', AjusteEstoqueView.as_view(), name='estoque_ajuste'),
    path('reajuste/', ReajustePrecoView.as_view(), name='estoque_reajuste'),
    path('meu-estoque/<int:pk>/historico/', EstoqueHistoricoView.as_view(), name='estoque_historico'),
] + router.urls
