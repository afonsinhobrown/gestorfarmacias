from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django.db import transaction
from .models import OrdemCompra, ItemOrdemCompra, RececaoStock
from .serializers import OrdemCompraSerializer, ItemOrdemCompraSerializer
from produtos.models import EstoqueProduto
import uuid

class OrdemCompraViewSet(viewsets.ModelViewSet):
    """Gestão do Ciclo de Vida de Compras."""
    serializer_class = OrdemCompraSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return OrdemCompra.objects.filter(farmacia=self.request.user.farmacia)

    def perform_create(self, serializer):
        # Gerar código automático style Primavera
        codigo = f"OC-{uuid.uuid4().hex[:6].upper()}"
        serializer.save(farmacia=self.request.user.farmacia, comprador=self.request.user, codigo=codigo)

    @decorators.action(detail=True, methods=['post'])
    def confirmar_rececao(self, request, pk=None):
        """
        DERRUBANDO PRIMAVERA: Atualização automática de Stock e Preços médios.
        Aqui recebemos os itens fisicamente e atualizamos o inventário.
        """
        ordem = self.get_object()
        itens_recebidos = request.data.get('itens', []) # Lista de {item_id, qtd, lote, validade}
        
        if ordem.status == OrdemCompra.StatusOrdem.CONCLUIDA:
            return Response({'error': 'Esta ordem já foi concluída.'}, status=400)

        with transaction.atomic():
            for entry in itens_recebidos:
                item_ordem = ItemOrdemCompra.objects.get(id=entry['item_id'], ordem=ordem)
                
                # 1. Atualizar quantidade recebida no item da ordem
                item_ordem.quantidade_recebida += entry['qtd']
                item_ordem.save()

                # 2. Criar ou atualizar o EstoqueProduto (Inventory Update)
                # DERRUBANDO PRIMAVERA: Lógica de atualização de Lote automática
                estoque, created = EstoqueProduto.objects.get_or_create(
                    produto=item_ordem.produto,
                    farmacia=ordem.farmacia,
                    lote=entry.get('lote', 'INDETERMINADO'),
                    defaults={'quantidade': 0, 'data_validade': entry.get('validade')}
                )
                estoque.quantidade += entry['qtd']
                
                # Atualizar preço de custo no estoque se mudou
                estoque.preco_custo = item_ordem.preco_unitario_acordado
                estoque.save()

            # Verificar se a ordem está totalmente recebida
            total_pedido = sum([i.quantidade_pedida for i in ordem.itens.all()])
            total_recebido = sum([i.quantidade_recebida for i in ordem.itens.all()])

            if total_recebido >= total_pedido:
                ordem.status = OrdemCompra.StatusOrdem.CONCLUIDA
            else:
                ordem.status = OrdemCompra.StatusOrdem.RECEBIDA_PARCIAL
            
            ordem.save()

        return Response({'status': 'Stock atualizado com sucesso', 'ordem_status': ordem.status})

    @decorators.action(detail=False, methods=['get'])
    def sugerir_compras(self, request):
        """
        SUPERANDO PRIMAVERA: Inteligência de Reposição.
        Sugere o que comprar baseado na velocidade de venda (últimos 30 dias).
        """
        from pedidos.models import Pedido
        from django.db.models import Sum
        from django.utils import timezone
        import datetime

        há_30_dias = timezone.now() - datetime.timedelta(days=30)
        
        # Produtos que venderam nos últimos 30 dias
        # Precisamos de ItensPedido para saber o produto
        from pedidos.models import ItemPedido
        vendas = ItemPedido.objects.filter(
            pedido__farmacia=request.user.farmacia,
            pedido__data_pedido__gte=há_30_dias
        ).values('produto').annotate(total_venda=Sum('quantidade'))

        sugestoes = []
        for v in vendas:
            p = Produto.objects.get(id=v['produto'])
            stock_atual = EstoqueProduto.objects.filter(produto=p, farmacia=request.user.farmacia).aggregate(Sum('quantidade'))['quantidade__sum'] or 0
            
            # Se o stock atual for menor que o vendido em 30 dias (ou se tivermos uma meta de stock)
            if stock_atual < v['total_venda']:
                sugestoes.append({
                    'id': p.id,
                    'nome': p.nome,
                    'vendido_30d': v['total_venda'],
                    'stock_atual': stock_atual,
                    'sugestao_compra': v['total_venda'] - stock_atual + (v['total_venda'] // 2) # Exemplo: 1.5x o giro
                })

        return Response(sugestoes)
