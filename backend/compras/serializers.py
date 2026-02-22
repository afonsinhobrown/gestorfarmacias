from rest_framework import serializers
from .models import OrdemCompra, ItemOrdemCompra, FaturaCompra, RececaoStock

class ItemOrdemCompraSerializer(serializers.ModelSerializer):
    produto_nome = serializers.ReadOnlyField(source='produto.nome')
    
    class Meta:
        model = ItemOrdemCompra
        fields = [
            'id', 'produto', 'produto_nome', 'quantidade_pedida', 
            'quantidade_recebida', 'preco_unitario_acordado', 'desconto', 'preco_ultima_compra'
        ]

class OrdemCompraSerializer(serializers.ModelSerializer):
    itens = ItemOrdemCompraSerializer(many=True, read_only=True)
    fornecedor_nome = serializers.ReadOnlyField(source='fornecedor.nome_fantasia')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = OrdemCompra
        fields = [
            'id', 'codigo', 'fornecedor', 'fornecedor_nome', 'status', 
            'status_display', 'data_emissao', 'data_entrega_prevista', 
            'valor_total', 'comprador', 'itens', 'observacoes'
        ]

class RececaoStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = RececaoStock
        fields = '__all__'
