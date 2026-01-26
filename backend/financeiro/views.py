from rest_framework import viewsets, permissions, filters
from .models import Despesa, CategoriaDespesa
from .serializers import DespesaSerializer, CategoriaDespesaSerializer

class DespesaViewSet(viewsets.ModelViewSet):
    """Gestão de Despesas da Farmácia."""
    serializer_class = DespesaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'categoria__nome']
    ordering_fields = ['data_vencimento', 'valor']
    ordering = ['-data_vencimento']

    def get_queryset(self):
        return Despesa.objects.filter(farmacia=self.request.user.farmacia)

class CategoriaDespesaViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaDespesaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Categorias da farmácia + Padrões do sistema (farmacia=None)
        from django.db.models import Q
        return CategoriaDespesa.objects.filter(
            Q(farmacia=self.request.user.farmacia) | Q(farmacia__isnull=True)
        )
