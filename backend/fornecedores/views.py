from rest_framework import generics, permissions
from .models import Fornecedor
from .serializers import FornecedorSerializer

class FornecedorListCreateView(generics.ListCreateAPIView):
    serializer_class = FornecedorSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Fornecedor.objects.filter(farmacia=self.request.user.farmacia)

    def perform_create(self, serializer):
        serializer.save(farmacia=self.request.user.farmacia)
