from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Q
from pedidos.models import Pedido
from .models import Entregador, Entrega
from .serializers import EntregaSerializer

class EntregasDisponiveisView(APIView):
    """Lista pedidos prontos para coleta por entregadores."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.tipo_usuario != 'ENTREGADOR':
            return Response({'error': 'Acesso restrito'}, status=403)
        
        # Pedidos prontos para entrega que não têm entregador vinculado
        pedidos = Pedido.objects.filter(
            status='PRONTO',
            entregador__isnull=True
        ).select_related('farmacia', 'cliente')
        
        data = []
        for p in pedidos:
            data.append({
                'pedido_id': p.id,
                'numero': p.numero_pedido,
                'farmacia': p.farmacia.nome,
                'bairro_origem': p.farmacia.bairro,
                'bairro_destino': p.bairro,
                'total': float(p.total),
                'taxa_entrega': float(p.taxa_entrega),
                'data': p.data_criacao
            })
        return Response(data)

class AceitarEntregaView(APIView):
    """Permite entregador aceitar um pedido."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pedido_id):
        if request.user.tipo_usuario != 'ENTREGADOR':
            return Response({'error': 'Acesso restrito'}, status=403)
            
        try:
            entregador = Entregador.objects.get(usuario=request.user)
            pedido = Pedido.objects.get(id=pedido_id, status='PRONTO', entregador__isnull=True)
            
            pedido.entregador = request.user
            pedido.status = 'EM_TRANSITO'
            pedido.save()
            
            return Response({'status': 'Pedido aceito', 'numero': pedido.numero_pedido})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class MinhasEntregasView(APIView):
    """Lista entregas vinculadas ao entregador logado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.tipo_usuario != 'ENTREGADOR':
            return Response({'error': 'Acesso restrito'}, status=403)
            
        pedidos = Pedido.objects.filter(entregador=request.user).order_by('-data_criacao')
        data = []
        for p in pedidos:
            data.append({
                'id': p.id,
                'numero': p.numero_pedido,
                'farmacia': p.farmacia.nome,
                'endereco_entrega': p.endereco_entrega,
                'status': p.status,
                'total': float(p.total),
                'pago': p.pago,
                'codigo_coleta': p.codigo_coleta,
                'codigo_entrega': p.codigo_entrega # Em prod o entregador não deve ver o de entrega antecipadamente
            })
        return Response(data)
