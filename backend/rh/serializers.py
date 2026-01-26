from rest_framework import serializers
from .models import Funcionario, FolhaPagamento

class FuncionarioSerializer(serializers.ModelSerializer):
    cargo_display = serializers.CharField(source='get_cargo_display', read_only=True)
    
    class Meta:
        model = Funcionario
        fields = '__all__'
        read_only_fields = ('farmacia',)

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'farmacia'):
             validated_data['farmacia'] = request.user.farmacia
        return super().create(validated_data)

class FolhaPagamentoSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)
    
    class Meta:
        model = FolhaPagamento
        fields = '__all__'
        read_only_fields = ('despesa_vinculada', 'total_liquido')
