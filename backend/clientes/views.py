from django.db import models
from rest_framework import viewsets, permissions, filters, status, decorators
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cliente, MovimentoContaCorrente
from .serializers import ClienteSerializer, ClienteCreateSerializer, MovimentoContaCorrenteSerializer
from django.db import transaction

class ClienteViewSet(viewsets.ModelViewSet):
    """Gestão de Clientes e Contas Correntes (DERRUBANDO PRIMAVERA)."""
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome_completo', 'telefone', 'nuit', 'email']
    ordering = ['-data_cadastro']
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ClienteCreateSerializer
        return ClienteSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'farmacia'):
            return Cliente.objects.filter(farmacia=user.farmacia)
        return Cliente.objects.none()

    @decorators.action(detail=True, methods=['get'])
    def extrato(self, request, pk=None):
        """Retorna o histórico completo da conta corrente."""
        cliente = self.get_object()
        movimentos = cliente.movimentos_cc.all()
        serializer = MovimentoContaCorrenteSerializer(movimentos, many=True)
        return Response(serializer.data)

    @decorators.action(detail=True, methods=['post'])
    def liquidar_pagamento(self, request, pk=None):
        """
        Regista a entrada de dinheiro para abater na dívida.
        DERRUBANDO PRIMAVERA: Eficiência no fluxo de caixa.
        """
        cliente = self.get_object()
        valor = request.data.get('valor')
        metodo = request.data.get('metodo', 'DINHEIRO')
        
        if not valor or float(valor) <= 0:
            return Response({'error': 'Valor inválido'}, status=400)

        with transaction.atomic():
            # 1. Registar Movimento de Crédito
            MovimentoContaCorrente.objects.create(
                cliente=cliente,
                tipo='CREDITO',
                valor=valor,
                descricao=f"Pagamento de Dívida - Método: {metodo}",
                realizado_por=request.user,
                is_liquidado=True
            )
            
            # 2. Atualizar Saldo
            cliente.saldo_atual -= valor
            cliente.save()

        return Response({
            'status': 'Pagamento registado com sucesso',
            'novo_saldo': cliente.saldo_atual
        })

    @decorators.action(detail=False, methods=['get'])
    def idade_saldo_critico(self, request):
        """
        SUPERANDO PRIMAVERA: Alerta proativo de dívidas vencidas.
        Lista clientes com dívidas vencidas há mais de 30 dias.
        """
        from django.utils import timezone
        hoje = timezone.now().date()
        
        clientes_devedores = Cliente.objects.filter(
            farmacia=request.user.farmacia,
            movimentos_cc__tipo='DEBITO',
            movimentos_cc__is_liquidado=False,
            movimentos_cc__data_vencimento__lt=hoje
        ).distinct()
        
        data = []
        for c in clientes_devedores:
            divida_vencida = c.movimentos_cc.filter(
                tipo='DEBITO', 
                data_vencimento__lt=hoje
            ).aggregate(total=models.Sum('valor'))['total'] or 0
            
            data.append({
                'id': c.id,
                'nome': c.nome_completo,
                'telefone': c.telefone,
                'total_divida': c.saldo_atual,
                'vencida': divida_vencida
            })
            
        return Response(data)
