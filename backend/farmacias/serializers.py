from rest_framework import serializers
from .models import Farmacia, AvaliacaoFarmacia, Notificacao, Gibagio, Licenca

class GibagioSerializer(serializers.ModelSerializer):
    """Serializer para a entidade de gestão local Gibagio."""
    class Meta:
        model = Gibagio
        fields = '__all__'

class LicencaSerializer(serializers.ModelSerializer):
    """Serializer para licenças de farmácias."""
    status_expirada = serializers.BooleanField(source='is_expirada', read_only=True)
    
    class Meta:
        model = Licenca
        fields = '__all__'

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
    gibagio_nome = serializers.CharField(source='gibagio.nome', read_only=True)
    licenca_ativa = serializers.SerializerMethodField()
    
    class Meta:
        model = Farmacia
        fields = (
            'id', 'nome', 'nome_fantasia', 'logo', 
            'endereco', 'bairro', 'cidade', 
            'latitude', 'longitude', 'distancia',
            'nota_media', 'total_avaliacoes',
            'is_ativa', 'is_verificada', 'gibagio', 'gibagio_nome',
            'licenca_ativa',
            'aceita_entregas', 'funciona_24h',
            'horario_abertura', 'horario_fechamento'
        )
    
    def get_licenca_ativa(self, obj):
        licenca = obj.licencas.filter(is_ativa=True).last()
        if licenca:
            return LicencaSerializer(licenca).data
        return None


class FarmaciaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para visão única de farmácia."""
    avaliacoes = AvaliacaoFarmaciaSerializer(many=True, read_only=True)
    licencas = LicencaSerializer(many=True, read_only=True)
    gibagio_detalhes = GibagioSerializer(source='gibagio', read_only=True)
    
    class Meta:
        model = Farmacia
        fields = '__all__'
        read_only_fields = (
            'id', 'usuario', 'nota_media', 'total_avaliacoes',
            'data_criacao', 'data_atualizacao'
        )
