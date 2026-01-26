from rest_framework import viewsets, permissions
from .models import Funcionario, FolhaPagamento
from .serializers import FuncionarioSerializer, FolhaPagamentoSerializer

class FuncionarioViewSet(viewsets.ModelViewSet):
    serializer_class = FuncionarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Funcionario.objects.filter(farmacia=self.request.user.farmacia)

class FolhaPagamentoViewSet(viewsets.ModelViewSet):
    serializer_class = FolhaPagamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FolhaPagamento.objects.filter(funcionario__farmacia=self.request.user.farmacia)
