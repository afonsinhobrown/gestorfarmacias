from rest_framework import serializers
from .models import MensagemPedido, Ticket, RespostaTicket

class MensagemPedidoSerializer(serializers.ModelSerializer):
    remetente_nome = serializers.CharField(source='remetente.get_full_name', read_only=True)
    remetente_tipo = serializers.CharField(source='remetente.tipo_usuario', read_only=True)
    
    class Meta:
        model = MensagemPedido
        fields = '__all__'
        read_only_fields = ('remetente', 'data_envio', 'lida')

class RespostaTicketSerializer(serializers.ModelSerializer):
    autor_nome = serializers.CharField(source='autor.get_full_name', read_only=True)
    
    class Meta:
        model = RespostaTicket
        fields = '__all__'
        read_only_fields = ('autor', 'data_envio')

class TicketSerializer(serializers.ModelSerializer):
    respostas = RespostaTicketSerializer(many=True, read_only=True)
    
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ('usuario', 'data_criacao', 'data_atualizacao', 'status')
