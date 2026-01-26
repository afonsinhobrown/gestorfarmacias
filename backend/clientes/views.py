from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cliente
from .serializers import ClienteSerializer, ClienteCreateSerializer


class ClienteListView(generics.ListAPIView):
    """Lista clientes da farmácia."""
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome_completo', 'telefone', 'nuit', 'email']
    ordering = ['-data_cadastro']
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'farmacia'):
            return Cliente.objects.filter(farmacia=user.farmacia, is_ativo=True)
        return Cliente.objects.none()


class ClienteCreateView(generics.CreateAPIView):
    """Cria um novo cliente (cadastro rápido)."""
    serializer_class = ClienteCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class ClienteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalhes, edição e exclusão de cliente."""
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'farmacia'):
            return Cliente.objects.filter(farmacia=user.farmacia)
        return Cliente.objects.none()
