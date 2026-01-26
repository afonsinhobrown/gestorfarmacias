from rest_framework import serializers
from .models import PlanoPrioridade, AssinaturaPrioridade, HistoricoPrioridade


class PlanoPrioridadeSerializer(serializers.ModelSerializer):
    """Serializer para planos de prioridade."""
    
    class Meta:
        model = PlanoPrioridade
        fields = [
            'id', 'nome', 'tipo', 'duracao_dias', 'preco',
            'descricao', 'ativo', 'ordem_prioridade'
        ]
        read_only_fields = ['id']


class AssinaturaPrioridadeSerializer(serializers.ModelSerializer):
    """Serializer para assinaturas de prioridade."""
    
    plano_detalhes = PlanoPrioridadeSerializer(source='plano', read_only=True)
    dias_restantes = serializers.SerializerMethodField()
    
    class Meta:
        model = AssinaturaPrioridade
        fields = [
            'id', 'plano', 'plano_detalhes', 'status',
            'data_solicitacao', 'data_inicio', 'data_fim',
            'valor_pago', 'comprovativo_pagamento',
            'observacoes_admin', 'dias_restantes'
        ]
        read_only_fields = [
            'id', 'status', 'data_solicitacao', 'data_inicio',
            'data_fim', 'observacoes_admin'
        ]
    
    def get_dias_restantes(self, obj):
        return obj.dias_restantes()
    
    def create(self, validated_data):
        # Determinar se é farmácia ou motoboy baseado no usuário
        user = self.context['request'].user
        
        if hasattr(user, 'farmacia'):
            validated_data['farmacia'] = user.farmacia
        elif hasattr(user, 'entregador'):
            validated_data['motoboy'] = user.entregador
        else:
            raise serializers.ValidationError('Usuário não é farmácia nem motoboy')
        
        return super().create(validated_data)


class HistoricoPrioridadeSerializer(serializers.ModelSerializer):
    """Serializer para histórico de prioridade."""
    
    usuario_nome = serializers.CharField(source='usuario.email', read_only=True)
    
    class Meta:
        model = HistoricoPrioridade
        fields = ['id', 'acao', 'usuario_nome', 'data', 'detalhes']
        read_only_fields = ['id', 'data']
