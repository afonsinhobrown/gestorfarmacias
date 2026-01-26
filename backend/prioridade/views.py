from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import PlanoPrioridade, AssinaturaPrioridade
from .serializers import (
    PlanoPrioridadeSerializer,
    AssinaturaPrioridadeSerializer
)


class ListarPlanosView(generics.ListAPIView):
    """Lista planos de prioridade disponíveis."""
    serializer_class = PlanoPrioridadeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Filtrar por tipo baseado no usuário
        user = self.request.user
        
        if hasattr(user, 'farmacia'):
            tipo = 'FARMACIA'
        elif hasattr(user, 'entregador'):
            tipo = 'MOTOBOY'
        else:
            return PlanoPrioridade.objects.none()
        
        return PlanoPrioridade.objects.filter(
            tipo=tipo,
            ativo=True
        ).order_by('ordem_prioridade', 'preco')


class MinhaAssinaturaView(APIView):
    """Retorna a assinatura ativa do usuário."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Buscar assinatura ativa
        assinatura = None
        if hasattr(user, 'farmacia'):
            assinatura = AssinaturaPrioridade.objects.filter(
                farmacia=user.farmacia,
                status='ATIVA'
            ).first()
        elif hasattr(user, 'entregador'):
            assinatura = AssinaturaPrioridade.objects.filter(
                motoboy=user.entregador,
                status='ATIVA'
            ).first()
        
        if assinatura:
            serializer = AssinaturaPrioridadeSerializer(assinatura)
            return Response(serializer.data)
        
        return Response({'detail': 'Nenhuma assinatura ativa'}, status=404)


class CriarAssinaturaView(generics.CreateAPIView):
    """Cria uma nova assinatura de prioridade."""
    serializer_class = AssinaturaPrioridadeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Verificar se já tem assinatura ativa
        user = self.request.user
        
        if hasattr(user, 'farmacia'):
            ativa = AssinaturaPrioridade.objects.filter(
                farmacia=user.farmacia,
                status__in=['ATIVA', 'PENDENTE']
            ).exists()
        elif hasattr(user, 'entregador'):
            ativa = AssinaturaPrioridade.objects.filter(
                motoboy=user.entregador,
                status__in=['ATIVA', 'PENDENTE']
            ).exists()
        else:
            raise serializers.ValidationError('Usuário inválido')
        
        if ativa:
            raise serializers.ValidationError(
                'Você já possui uma assinatura ativa ou pendente'
            )
        
        serializer.save()


class HistoricoAssinaturasView(generics.ListAPIView):
    """Lista histórico de assinaturas do usuário."""
    serializer_class = AssinaturaPrioridadeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'farmacia'):
            return AssinaturaPrioridade.objects.filter(
                farmacia=user.farmacia
            ).order_by('-data_solicitacao')
        elif hasattr(user, 'entregador'):
            return AssinaturaPrioridade.objects.filter(
                motoboy=user.entregador
            ).order_by('-data_solicitacao')
        
        return AssinaturaPrioridade.objects.none()
