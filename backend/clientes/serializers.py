from rest_framework import serializers
from .models import Cliente, MovimentoContaCorrente

class MovimentoContaCorrenteSerializer(serializers.ModelSerializer):
    operador_nome = serializers.ReadOnlyField(source='realizado_por.get_full_name')
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = MovimentoContaCorrente
        fields = [
            'id', 'tipo', 'tipo_display', 'valor', 'data_movimento', 
            'data_vencimento', 'descricao', 'operador_nome', 'pedido', 'is_liquidado'
        ]

class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para clientes da farmácia."""
    movimentos_recentes = serializers.SerializerMethodField()
    
    class Meta:
        model = Cliente
        fields = (
            'id', 'nome_completo', 'telefone', 'email', 'nuit',
            'endereco', 'bairro', 'cidade', 'tipo', 'observacoes',
            'data_cadastro', 'is_ativo', 'limite_credito', 'saldo_atual', 
            'is_bloqueado', 'movimentos_recentes'
        )
        read_only_fields = ('data_cadastro', 'farmacia', 'usuario', 'saldo_atual', 'movimentos_recentes')
    
    def get_movimentos_recentes(self, obj):
        movs = obj.movimentos_cc.all()[:5]
        return MovimentoContaCorrenteSerializer(movs, many=True).data

    def create(self, validated_data):
        validated_data['farmacia'] = self.context['request'].user.farmacia
        validated_data['tipo'] = Cliente.TipoCliente.CADASTRADO
        return super().create(validated_data)


class ClienteCreateSerializer(serializers.ModelSerializer):
    """Serializer simplificado para cadastro rápido no POS."""
    
    class Meta:
        model = Cliente
        fields = ('nome_completo', 'telefone', 'nuit')
    
    def create(self, validated_data):
        validated_data['farmacia'] = self.context['request'].user.farmacia
        validated_data['tipo'] = Cliente.TipoCliente.CADASTRADO
        return super().create(validated_data)
