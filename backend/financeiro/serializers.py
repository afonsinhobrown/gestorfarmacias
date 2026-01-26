from rest_framework import serializers
from .models import Despesa, CategoriaDespesa

class CategoriaDespesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaDespesa
        fields = '__all__'

class DespesaSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.get_full_name', read_only=True)
    
    class Meta:
        model = Despesa
        fields = '__all__'
        read_only_fields = ('criado_por', 'data_criacao', 'farmacia')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'farmacia'):
             validated_data['farmacia'] = request.user.farmacia
             validated_data['criado_por'] = request.user
        return super().create(validated_data)
