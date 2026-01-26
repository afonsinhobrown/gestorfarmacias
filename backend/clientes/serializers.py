from rest_framework import serializers
from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para clientes da farmácia."""
    
    class Meta:
        model = Cliente
        fields = (
            'id', 'nome_completo', 'telefone', 'email', 'nuit',
            'endereco', 'bairro', 'cidade', 'tipo', 'observacoes',
            'data_cadastro', 'is_ativo'
        )
        read_only_fields = ('data_cadastro', 'farmacia', 'usuario')
    
    def create(self, validated_data):
        # Adiciona a farmácia do usuário logado
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
