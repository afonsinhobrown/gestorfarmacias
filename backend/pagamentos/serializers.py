from rest_framework import serializers
from .models import Pagamento, CartaoCredito, Reembolso, HistoricoPagamento

class PagamentoListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de pagamentos."""
    pedido_numero = serializers.CharField(source='pedido.numero_pedido', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    metodo_display = serializers.CharField(source='get_metodo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Pagamento
        fields = (
            'id', 'uuid', 'numero_transacao', 'pedido', 'pedido_numero',
            'usuario', 'usuario_nome', 'metodo', 'metodo_display',
            'status', 'status_display', 'valor', 'taxa_processamento',
            'valor_total', 'data_criacao', 'data_aprovacao'
        )


class PagamentoDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para pagamento."""
    pedido_numero = serializers.CharField(source='pedido.numero_pedido', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    historico = serializers.SerializerMethodField()
    
    class Meta:
        model = Pagamento
        fields = '__all__'
    
    def get_historico(self, obj):
        historico = obj.historico.all()[:10]
        return HistoricoPagamentoSerializer(historico, many=True).data


class PagamentoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criar pagamento."""
    
    class Meta:
        model = Pagamento
        fields = ('pedido', 'metodo', 'valor', 'observacoes')
    
    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        validated_data['status'] = Pagamento.StatusPagamento.PENDENTE
        return super().create(validated_data)


class CartaoCreditoSerializer(serializers.ModelSerializer):
    """Serializer para cartões de crédito."""
    
    class Meta:
        model = CartaoCredito
        fields = (
            'id', 'token_gateway', 'ultimos_digitos', 'bandeira',
            'nome_titular', 'mes_validade', 'ano_validade',
            'is_principal', 'is_ativo', 'data_criacao'
        )
        read_only_fields = ('token_gateway',)


class ReembolsoSerializer(serializers.ModelSerializer):
    """Serializer para reembolsos."""
    pagamento_numero = serializers.CharField(source='pagamento.numero_transacao', read_only=True)
    
    class Meta:
        model = Reembolso
        fields = '__all__'
        read_only_fields = ('data_solicitacao', 'data_analise', 'data_aprovacao', 'data_conclusao', 'data_recusa')


class HistoricoPagamentoSerializer(serializers.ModelSerializer):
    """Serializer para histórico de pagamento."""
    
    class Meta:
        model = HistoricoPagamento
        fields = '__all__'
