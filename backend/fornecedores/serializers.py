from rest_framework import serializers
from .models import Fornecedor

class FornecedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fornecedor
        fields = '__all__'
        read_only_fields = ('farmacia', 'data_cadastro', 'data_atualizacao')
