"""
Views e2Payments - DOCUMENTAÇÃO OFICIAL
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .e2payments_service import e2payments_service
from pedidos.models import Pedido
from .models import Pagamento
import logging
import uuid

logger = logging.getLogger(__name__)


class IniciarPagamentoE2PaymentsView(APIView):
    """Pagamento C2B M-Pesa via e2Payments."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        {
            "pedido_id": 123,
            "telefone": "841234567",  // 9 dígitos
            "wallet_id": "123456"
        }
        """
        pedido_id = request.data.get('pedido_id')
        telefone = request.data.get('telefone')
        wallet_id = request.data.get('wallet_id')
        
        if not all([pedido_id, telefone, wallet_id]):
            return Response({'erro': 'Campos obrigatórios faltando'}, status=400)
        
        try:
            pedido = Pedido.objects.get(id=pedido_id, cliente=request.user)
        except Pedido.DoesNotExist:
            return Response({'erro': 'Pedido não encontrado'}, status=404)
        
        if pedido.status_pagamento == 'PAGO':
            return Response({'erro': 'Já pago'}, status=400)
        
        # Limpar telefone (9 dígitos)
        telefone_limpo = telefone.replace('+258', '').replace(' ', '')[-9:]
        
        # Reference sem espaços
        reference = f"GF{pedido.id}{uuid.uuid4().hex[:6].upper()}"
        
        # Criar pagamento
        pagamento = Pagamento.objects.create(
            pedido=pedido,
            metodo='MPESA',
            valor=pedido.total,
            status='PENDENTE',
            transaction_id=reference,
            dados_adicionais={
                'telefone': telefone_limpo,
                'wallet_id': wallet_id,
                'reference': reference
            }
        )
        
        # Chamar API
        resultado = e2payments_service.c2b_mpesa_payment(
            wallet_id=wallet_id,
            amount=float(pedido.total),
            phone=telefone_limpo,
            reference=reference
        )
        
        if resultado.get('success'):
            pagamento.dados_adicionais['response'] = resultado['data']
            pagamento.save()
            
            return Response({
                'mensagem': 'Pagamento iniciado! Verifique seu celular.',
                'pagamento_id': pagamento.id,
                'reference': reference
            })
        else:
            pagamento.status = 'FALHOU'
            pagamento.dados_adicionais['erro'] = resultado.get('error')
            pagamento.save()
            
            return Response({
                'erro': 'Falha ao iniciar',
                'detalhes': resultado.get('error')
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class E2PaymentsCallbackView(APIView):
    """Callback e2Payments."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        logger.info(f"Callback: {request.data}")
        
        try:
            reference = request.data.get('reference')
            status_payment = request.data.get('status')
            
            try:
                pagamento = Pagamento.objects.get(
                    dados_adicionais__reference=reference
                )
            except Pagamento.DoesNotExist:
                logger.error(f"Não encontrado: {reference}")
                return Response({'status': 'error'})
            
            if status_payment in ['success', 'completed']:
                pagamento.status = 'CONFIRMADO'
                pagamento.pedido.status_pagamento = 'PAGO'
                pagamento.pedido.save()
            else:
                pagamento.status = 'FALHOU'
            
            pagamento.dados_adicionais['callback'] = request.data
            pagamento.save()
            
            return Response({'status': 'success'})
        
        except Exception as e:
            logger.error(f"Erro: {e}")
            return Response({'status': 'error'}, status=500)


class ConsultarStatusE2PaymentsView(APIView):
    """Consulta status."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pagamento_id):
        try:
            pagamento = Pagamento.objects.get(
                id=pagamento_id,
                pedido__cliente=request.user
            )
        except Pagamento.DoesNotExist:
            return Response({'erro': 'Não encontrado'}, status=404)
        
        return Response({'status': pagamento.status})


class ListarCarteirasView(APIView):
    """Lista carteiras do usuário."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        resultado = e2payments_service.get_all_wallets()
        return Response(resultado)
