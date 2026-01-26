from django.urls import path
from .views import FornecedorListCreateView

urlpatterns = [
    path('', FornecedorListCreateView.as_view(), name='fornecedor_list_create'),
]
