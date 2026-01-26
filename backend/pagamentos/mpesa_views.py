"""
Views para processamento de pagamentos M-Pesa
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from .mpesa_service import mpesa_service
from pedidos.models import Pedido
from .models import Pagamento
import logging
import uuid

logger = logging.getLogger(__name__)


class IniciarPagamentoMPesaView(APIView):
    """Inicia um pagamento via M-Pesa."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Payload esperado:
        {
            "pedido_id": 123,
            "telefone": "841234567"  # ou "258841234567"
        }
        """
        pedido_id = request.data.get('pedido_id')
        telefone = request.data.get('telefone')
        
        if not pedido_id or not telefone:
            return Response(
                {'erro': 'pedido_id e telefone são obrigatórios'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            pedido = Pedido.objects.get(id=pedido_id, cliente=request.user)
        except Pedido.DoesNotExist:
            return Response(
                {'erro': 'Pedido não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar se já não foi pago
        if pedido.status_pagamento == 'PAGO':
            return Response(
                {'erro': 'Este pedido já foi pago'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Gerar ID único para a transação
        transaction_id = f"GF{pedido.id}{uuid.uuid4().hex[:8].upper()}"
        
        # Criar registro de pagamento
        pagamento = Pagamento.objects.create(
            pedido=pedido,
            metodo='MPESA',
            valor=pedido.total,
            status='PENDENTE',
            transaction_id=transaction_id,
            dados_adicionais={
                'telefone': telefone,
                'iniciado_em': str(timezone.now())
            }
        )
        
        # Iniciar pagamento M-Pesa
        resultado = mpesa_service.c2b_payment(
            phone_number=telefone,
            amount=float(pedido.total),
            reference=f"Pedido-{pedido.numero_pedido}",
            transaction_id=transaction_id
        )
        
        if resultado.get('success'):
            # Atualizar pagamento com dados da resposta
            pagamento.dados_adicionais.update({
                'conversation_id': resultado.get('conversation_id'),
                'mpesa_transaction_id': resultado.get('transaction_id'),
                'resposta_mpesa': resultado.get('data')
            })
            pagamento.save()
            
            return Response({
                'mensagem': 'Pagamento iniciado! Verifique seu celular para confirmar.',
                'pagamento_id': pagamento.id,
                'conversation_id': resultado.get('conversation_id'),
                'instrucoes': 'Digite seu PIN do M-Pesa no celular para confirmar o pagamento.'
            }, status=status.HTTP_200_OK)
        
        else:
            pagamento.status = 'FALHOU'
            pagamento.dados_adicionais['erro'] = resultado.get('error')
            pagamento.save()
            
            return Response({
                'erro': 'Falha ao iniciar pagamento M-Pesa',
                'detalhes': resultado.get('error')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class MPesaCallbackView(APIView):
    """
    Recebe callbacks da API M-Pesa quando o pagamento é confirmado.
    Esta URL deve ser configurada no portal da Vodacom.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Payload do callback M-Pesa:
        {
            "output_ResponseCode": "INS-0",
            "output_ResponseDesc": "Request processed successfully",
            "output_TransactionID": "ABC123",
            "output_ConversationID": "XYZ789",
            "output_ThirdPartyReference": "Pedido-12345"
        }
        """
        logger.info(f"Callback M-Pesa recebido: {request.data}")
        
        try:
            response_code = request.data.get('output_ResponseCode')
            transaction_id = request.data.get('output_TransactionID')
            conversation_id = request.data.get('output_ConversationID')
            
            # Buscar pagamento pelo conversation_id
            try:
                pagamento = Pagamento.objects.get(
                    dados_adicionais__conversation_id=conversation_id
                )
            except Pagamento.DoesNotExist:
                logger.error(f"Pagamento não encontrado para conversation_id: {conversation_id}")
                return Response({'status': 'error', 'message': 'Pagamento não encontrado'})
            
            # Atualizar status baseado no response code
            if response_code == 'INS-0':  # Sucesso
                pagamento.status = 'CONFIRMADO'
                pagamento.pedido.status_pagamento = 'PAGO'
                pagamento.pedido.save()
                
                logger.info(f"Pagamento confirmado: Pedido #{pagamento.pedido.numero_pedido}")
            
            else:  # Falha
                pagamento.status = 'FALHOU'
                logger.warning(f"Pagamento falhou: {response_code}")
            
            # Salvar dados do callback
            pagamento.dados_adicionais['callback'] = request.data
            pagamento.save()
            
            return Response({'status': 'success'}, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Erro ao processar callback M-Pesa: {e}")
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConsultarStatusPagamentoView(APIView):
    """Consulta o status de um pagamento M-Pesa."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pagamento_id):
        try:
            pagamento = Pagamento.objects.get(id=pagamento_id, pedido__cliente=request.user)
        except Pagamento.DoesNotExist:
            return Response({'erro': 'Pagamento não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        # Se já está confirmado, retornar status
        if pagamento.status == 'CONFIRMADO':
            return Response({
                'status': 'CONFIRMADO',
                'mensagem': 'Pagamento confirmado com sucesso!'
            })
        
        # Consultar status na API M-Pesa
        conversation_id = pagamento.dados_adicionais.get('conversation_id')
        transaction_id = pagamento.transaction_id
        
        if conversation_id and transaction_id:
            resultado = mpesa_service.query_transaction_status(conversation_id, transaction_id)
            
            return Response({
                'status': pagamento.status,
                'detalhes': resultado
            })
        
        return Response({
            'status': pagamento.status,
            'mensagem': 'Aguardando confirmação do M-Pesa'
        })
