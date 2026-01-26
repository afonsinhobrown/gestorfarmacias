from rest_framework import serializers
from .models import Farmacia, AvaliacaoFarmacia, Notificacao

class NotificacaoSerializer(serializers.ModelSerializer):
    """Serializer para notificações da farmácia."""
    class Meta:
        model = Notificacao
        fields = ('id', 'tipo', 'titulo', 'mensagem', 'lida', 'data_criacao')
        read_only_fields = ('id', 'data_criacao')

class AvaliacaoFarmaciaSerializer(serializers.ModelSerializer):
    """Serializer para avaliações de farmácias."""
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = AvaliacaoFarmacia
        fields = ('id', 'usuario_nome', 'nota', 'comentario', 'data_criacao')
        read_only_fields = ('id', 'data_criacao')


class FarmaciaListSerializer(serializers.ModelSerializer):
    """Serializer simples para listagem de farmácias."""
    distancia = serializers.FloatField(read_only=True, required=False) # Calculado via anotação
    
    class Meta:
        model = Farmacia
        fields = (
            'id', 'nome', 'nome_fantasia', 'logo', 
            'endereco', 'bairro', 'cidade', 
            'latitude', 'longitude', 'distancia',
            'nota_media', 'total_avaliacoes',
            'is_ativa', 'is_verificada', 
            'aceita_entregas', 'funciona_24h',
            'horario_abertura', 'horario_fechamento'
        )


class FarmaciaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para visão única de farmácia."""
    avaliacoes = AvaliacaoFarmaciaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Farmacia
        fields = '__all__'
        read_only_fields = (
            'id', 'usuario', 'nota_media', 'total_avaliacoes',
            'data_criacao', 'data_atualizacao'
        )
