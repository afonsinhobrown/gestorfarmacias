from rest_framework import serializers
from .models import Caixa, SessaoCaixa, MovimentoCaixa

class CaixaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caixa
        fields = '__all__'
        read_only_fields = ['farmacia']

class MovimentoCaixaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimentoCaixa
        fields = '__all__'

class SessaoCaixaSerializer(serializers.ModelSerializer):
    operador_nome = serializers.CharField(source='operador.first_name', read_only=True)
    caixa_nome = serializers.CharField(source='caixa.nome', read_only=True)
    movimentos = MovimentoCaixaSerializer(many=True, read_only=True)
    
    class Meta:
        model = SessaoCaixa
        fields = '__all__'

class AberturaCaixaSerializer(serializers.Serializer):
    caixa_id = serializers.IntegerField()
    valor_abertura = serializers.DecimalField(max_digits=12, decimal_places=2)

class FechamentoCaixaSerializer(serializers.Serializer):
    valor_declarado_dinheiro = serializers.DecimalField(max_digits=12, decimal_places=2)
    valor_declarado_pos = serializers.DecimalField(max_digits=12, decimal_places=2)
    valor_declarado_mpesa = serializers.DecimalField(max_digits=12, decimal_places=2)
    valor_declarado_emola = serializers.DecimalField(max_digits=12, decimal_places=2)
    valor_declarado_outros = serializers.DecimalField(max_digits=12, decimal_places=2)
    observacoes = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
