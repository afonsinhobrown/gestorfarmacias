from rest_framework import serializers
from .models import Entregador, Entrega, RastreamentoEntrega, AvaliacaoEntrega
from pedidos.serializers import PedidoListSerializer

class EntregadorSerializer(serializers.ModelSerializer):
    """Serializer para perfil do entregador."""
    nome_completo = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario = serializers.SerializerMethodField()
    
    class Meta:
        model = Entregador
        fields = '__all__'
        read_only_fields = ('usuario', 'data_cadastro', 'nota_media', 'total_entregas')
    
    def get_usuario(self, obj):
        return {
            'id': obj.usuario.id,
            'email': obj.usuario.email,
            'first_name': obj.usuario.first_name,
            'last_name': obj.usuario.last_name,
            'telefone': obj.usuario.telefone,
        }

class RastreamentoEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RastreamentoEntrega
        fields = ('latitude', 'longitude', 'timestamp')

class EntregaSerializer(serializers.ModelSerializer):
    """Serializer para detalhes da entrega."""
    pedido = PedidoListSerializer(read_only=True)
    entregador_nome = serializers.CharField(source='entregador.usuario.get_full_name', read_only=True)
    
    class Meta:
        model = Entrega
        fields = '__all__'
        read_only_fields = (
            'data_criacao', 'data_atribuicao', 'data_aceitacao', 
            'data_coleta', 'data_entrega', 'codigo_validacao_coleta', 
            'codigo_validacao_entrega'
        )

class AvaliacaoEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvaliacaoEntrega
        fields = '__all__'
