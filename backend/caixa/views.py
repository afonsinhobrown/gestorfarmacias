from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Sum
from .models import Caixa, SessaoCaixa, MovimentoCaixa
from .serializers import (
    CaixaSerializer, SessaoCaixaSerializer, MovimentoCaixaSerializer,
    AberturaCaixaSerializer, FechamentoCaixaSerializer
)
from pedidos.models import Pedido

class CaixaViewSet(viewsets.ModelViewSet):
    """Gestão de terminais de caixa."""
    serializer_class = CaixaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Caixa.objects.filter(farmacia=self.request.user.farmacia)

    def perform_create(self, serializer):
        serializer.save(farmacia=self.request.user.farmacia)

class SessaoCaixaView(APIView):
    """Controle de abertura, fecho e status do turno atual."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Retorna a sessão ativa do usuário atual ou erro se não houver."""
        sessao = SessaoCaixa.objects.filter(
            operador=request.user, 
            status=SessaoCaixa.StatusSessao.ABERTO
        ).first()
        
        if not sessao:
            return Response({'status': 'SEM_SESSAO'}, status=200)
            
        # Atualizar valores do sistema em tempo real (Superando Primavera)
        self._atualizar_valores_sistema(sessao)
        
        serializer = SessaoCaixaSerializer(sessao)
        return Response(serializer.data)

    def post(self, request, action=None):
        if action == 'abrir':
            return self._abrir_caixa(request)
        elif action == 'fechar':
            return self._fechar_caixa(request)
        return Response({'error': 'Ação inválida'}, status=400)

    def _abrir_caixa(self, request):
        # Verifica se já existe sessão aberta
        aberta = SessaoCaixa.objects.filter(operador=request.user, status='ABERTO').exists()
        if aberta:
            return Response({'error': 'Você já possui uma sessão de caixa aberta.'}, status=400)
            
        serializer = AberturaCaixaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        caixa = Caixa.objects.get(id=serializer.validated_data['caixa_id'])
        
        sessao = SessaoCaixa.objects.create(
            caixa=caixa,
            operador=request.user,
            valor_abertura=serializer.validated_data['valor_abertura'],
            valor_sistema_dinheiro=serializer.validated_data['valor_abertura'], # Começa com o fundo
            total_sistema=serializer.validated_data['valor_abertura'],
            status='ABERTO'
        )
        
        return Response(SessaoCaixaSerializer(sessao).data, status=201)

    def _fechar_caixa(self, request):
        sessao = SessaoCaixa.objects.filter(operador=request.user, status='ABERTO').first()
        if not sessao:
            return Response({'error': 'Nenhuma sessão aberta encontrada.'}, status=404)
            
        serializer = FechamentoCaixaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Atualizar valores finais do sistema
        self._atualizar_valores_sistema(sessao)
        
        # Salvar declaração do operador
        sessao.valor_declarado_dinheiro = serializer.validated_data['valor_declarado_dinheiro']
        sessao.valor_declarado_pos = serializer.validated_data['valor_declarado_pos']
        sessao.valor_declarado_mpesa = serializer.validated_data['valor_declarado_mpesa']
        sessao.valor_declarado_emola = serializer.validated_data['valor_declarado_emola']
        sessao.valor_declarado_outros = serializer.validated_data['valor_declarado_outros']
        
        sessao.observacoes = serializer.validated_data.get('observacoes', '')
        sessao.latitude = serializer.validated_data.get('latitude')
        sessao.longitude = serializer.validated_data.get('longitude')
        
        sessao.status = 'FECHADO'
        sessao.data_fechamento = timezone.now()
        
        # Calcular totais e discrepâncias
        sessao.total_declarado = (
            sessao.valor_declarado_dinheiro + sessao.valor_declarado_pos +
            sessao.valor_declarado_mpesa + sessao.valor_declarado_emola +
            sessao.valor_declarado_outros
        )
        sessao.diferenca = sessao.total_declarado - sessao.total_sistema
        
        sessao.save()
        
        return Response(SessaoCaixaSerializer(sessao).data)

    def _atualizar_valores_sistema(self, sessao):
        """Calcula o que deveria estar no caixa baseado nas vendas e movimentos."""
        vendas = Pedido.objects.filter(sessao_caixa=sessao, status__in=['ENTREGUE', 'PAGO', 'CONFIRMADO'])
        
        # Somas por tipo de pagamento
        sistema_dinheiro = vendas.filter(forma_pagamento='DINHEIRO').aggregate(s=Sum('total'))['s'] or 0
        sistema_pos = vendas.filter(forma_pagamento='POS').aggregate(s=Sum('total'))['s'] or 0
        sistema_mpesa = vendas.filter(forma_pagamento='MPESA').aggregate(s=Sum('total'))['s'] or 0
        sistema_emola = vendas.filter(forma_pagamento='EMOLA').aggregate(s=Sum('total'))['s'] or 0
        sistema_outros = vendas.exclude(forma_pagamento__in=['DINHEIRO', 'POS', 'MPESA', 'EMOLA']).aggregate(s=Sum('total'))['s'] or 0
        
        # Movimentos (Sangrias e Reforços) - Apenas dinheiro físico
        reforcos = MovimentoCaixa.objects.filter(sessao=sessao, tipo='REFORCO').aggregate(s=Sum('valor'))['s'] or 0
        sangrias = MovimentoCaixa.objects.filter(sessao=sessao, tipo__in=['SANGRIA', 'PAGAMENTO']).aggregate(s=Sum('valor'))['s'] or 0
        
        # O dinheiro no sistema = Abertura + Vendas Dinheiro + Reforços - Sangrias
        sessao.valor_sistema_dinheiro = sessao.valor_abertura + sistema_dinheiro + reforcos - sangrias
        sessao.valor_sistema_pos = sistema_pos
        sessao.valor_sistema_mpesa = sistema_mpesa
        sessao.valor_sistema_emola = sistema_emola
        sessao.valor_sistema_outros = sistema_outros
        
        sessao.total_sistema = (
            sessao.valor_sistema_dinheiro + sessao.valor_sistema_pos + 
            sessao.valor_sistema_mpesa + sessao.valor_sistema_emola + 
            sessao.valor_sistema_outros
        )
        sessao.save()

class MovimentoCaixaViewSet(viewsets.ModelViewSet):
    """Registro de sangrias e reforços."""
    serializer_class = MovimentoCaixaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MovimentoCaixa.objects.filter(sessao__operador=self.request.user)

    def perform_create(self, serializer):
        sessao = SessaoCaixa.objects.filter(operador=self.request.user, status='ABERTO').first()
        if not sessao:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Não há sessão de caixa aberta para este usuário.")
        serializer.save(sessao=sessao)
