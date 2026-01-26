from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Pagamento, CartaoCredito, Reembolso
from .serializers import (
    PagamentoListSerializer, PagamentoDetailSerializer, 
    PagamentoCreateSerializer, CartaoCreditoSerializer,
    ReembolsoSerializer
)


class PagamentoListView(generics.ListAPIView):
    """Lista pagamentos do usuário ou da farmácia."""
    serializer_class = PagamentoListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'status': ['exact', 'in'],
        'metodo': ['exact'],
        'data_criacao': ['gte', 'lte', 'date'],
    }
    search_fields = ['numero_transacao', 'pedido__numero_pedido']
    ordering = ['-data_criacao']
    
    def get_queryset(self):
        user = self.request.user
        
        # Se for farmácia, vê pagamentos dos pedidos da farmácia
        if hasattr(user, 'farmacia'):
            return Pagamento.objects.filter(pedido__farmacia=user.farmacia).select_related('pedido', 'usuario')
        
        # Se for cliente, vê seus pagamentos
        return Pagamento.objects.filter(usuario=user).select_related('pedido')


class PagamentoDetailView(generics.RetrieveAPIView):
    """Detalhes de um pagamento."""
    serializer_class = PagamentoDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'farmacia'):
            return Pagamento.objects.filter(pedido__farmacia=user.farmacia)
        return Pagamento.objects.filter(usuario=user)


class PagamentoCreateView(generics.CreateAPIView):
    """Cria um novo pagamento."""
    serializer_class = PagamentoCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class AtualizarStatusPagamentoView(APIView):
    """Atualiza o status de um pagamento."""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            pagamento = Pagamento.objects.get(pk=pk)
            
            # Verificar permissão
            if hasattr(request.user, 'farmacia'):
                if pagamento.pedido.farmacia != request.user.farmacia:
                    return Response({'erro': 'Sem permissão'}, status=status.HTTP_403_FORBIDDEN)
            elif pagamento.usuario != request.user and not request.user.is_staff:
                return Response({'erro': 'Sem permissão'}, status=status.HTTP_403_FORBIDDEN)
            
            novo_status = request.data.get('status')
            
            if novo_status not in Pagamento.StatusPagamento.values:
                return Response({'erro': 'Status inválido'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Criar histórico
            from .models import HistoricoPagamento
            HistoricoPagamento.objects.create(
                pagamento=pagamento,
                status_anterior=pagamento.status,
                status_novo=novo_status,
                observacao=request.data.get('observacao', '')
            )
            
            # Atualizar status
            pagamento.status = novo_status
            
            # Atualizar timestamps conforme status
            if novo_status == Pagamento.StatusPagamento.APROVADO:
                pagamento.data_aprovacao = timezone.now()
                # Marcar pedido como pago
                pagamento.pedido.pago = True
                pagamento.pedido.save()
            elif novo_status == Pagamento.StatusPagamento.RECUSADO:
                pagamento.data_recusa = timezone.now()
            elif novo_status == Pagamento.StatusPagamento.CANCELADO:
                pagamento.data_cancelamento = timezone.now()
            
            pagamento.save()
            
            return Response({
                'mensagem': f'Status atualizado para {novo_status}',
                'pagamento': PagamentoDetailSerializer(pagamento).data
            })
            
        except Pagamento.DoesNotExist:
            return Response({'erro': 'Pagamento não encontrado'}, status=status.HTTP_404_NOT_FOUND)


class PagamentosStatisticsView(APIView):
    """Estatísticas de pagamentos."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from django.db.models import Sum, Count
        
        user = request.user
        
        # Base queryset
        if hasattr(user, 'farmacia'):
            qs = Pagamento.objects.filter(pedido__farmacia=user.farmacia)
        else:
            qs = Pagamento.objects.filter(usuario=user)
        
        # Estatísticas
        hoje = timezone.now().date()
        
        stats = {
            'total_recebido': qs.filter(status='APROVADO').aggregate(Sum('valor_total'))['valor_total__sum'] or 0,
            'total_pendente': qs.filter(status='PENDENTE').aggregate(Sum('valor_total'))['valor_total__sum'] or 0,
            'total_hoje': qs.filter(data_criacao__date=hoje, status='APROVADO').aggregate(Sum('valor_total'))['valor_total__sum'] or 0,
            'qtd_aprovados': qs.filter(status='APROVADO').count(),
            'qtd_pendentes': qs.filter(status='PENDENTE').count(),
            'qtd_recusados': qs.filter(status='RECUSADO').count(),
            'por_metodo': {}
        }
        
        # Agrupamento por método
        metodos = qs.values('metodo').annotate(
            total=Sum('valor_total'),
            quantidade=Count('id')
        )
        
        for m in metodos:
            stats['por_metodo'][m['metodo']] = {
                'total': float(m['total'] or 0),
                'quantidade': m['quantidade']
            }
        
        return Response(stats)


class CartaoCreditoListView(generics.ListCreateAPIView):
    """Lista e cria cartões de crédito."""
    serializer_class = CartaoCreditoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CartaoCredito.objects.filter(usuario=self.request.user, is_ativo=True)
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class ReembolsoListView(generics.ListCreateAPIView):
    """Lista e cria reembolsos."""
    serializer_class = ReembolsoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'farmacia'):
            return Reembolso.objects.filter(pagamento__pedido__farmacia=user.farmacia)
        return Reembolso.objects.filter(pagamento__usuario=user)
