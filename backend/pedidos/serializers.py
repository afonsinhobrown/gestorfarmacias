from rest_framework import serializers
from .models import Pedido, ItemPedido, HistoricoPedido
from produtos.serializers import ProdutoSerializer
from produtos.models import EstoqueProduto
from django.db import transaction

class ItemPedidoSerializer(serializers.ModelSerializer):
    """Serializer para os itens dentro do pedido."""
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    produto_imagem = serializers.ImageField(source='produto.imagem_principal', read_only=True)
    
    class Meta:
        model = ItemPedido
        fields = (
            'id', 'produto', 'produto_nome', 'produto_imagem',
            'quantidade', 'preco_unitario', 'subtotal', 'observacoes'
        )
        read_only_fields = ('subtotal',)


class PedidoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de pedidos."""
    itens = ItemPedidoSerializer(many=True)
    
    class Meta:
        model = Pedido
        fields = (
            'id', 'numero_pedido', 'farmacia', 'forma_pagamento', 'endereco_entrega', 
            'bairro', 'cidade', 'referencia', 'latitude', 'longitude',
            'telefone_contato', 'observacoes', 'itens'
        )
        read_only_fields = ('id', 'numero_pedido')
    
    def validate(self, data):
        """Validação customizada."""
        print(f"DEBUG - Dados recebidos: {data}")
        
        # Validar itens
        if not data.get('itens'):
            raise serializers.ValidationError({'itens': 'Pelo menos um item é obrigatório'})
        
        # Validar farmacia
        if not data.get('farmacia'):
            raise serializers.ValidationError({'farmacia': 'Farmácia é obrigatória'})
        
        return data
    
    def create(self, validated_data):
        print(f"DEBUG - Criando pedido com: {validated_data}")
        itens_data = validated_data.pop('itens')
        pedido = Pedido.objects.create(**validated_data)
        
        for item_data in itens_data:
            ItemPedido.objects.create(pedido=pedido, **item_data)
        
        # Recalcular totais
        pedido.calcular_total()
        return pedido


class PedidoListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de pedidos."""
    farmacia_nome = serializers.CharField(source='farmacia.nome', read_only=True)
    cliente_nome = serializers.SerializerMethodField()
    total_itens = serializers.SerializerMethodField()
    
    class Meta:
        model = Pedido
        fields = (
            'id', 'numero_pedido', 'farmacia_nome', 'cliente_nome', 'status', 
            'data_criacao', 'total', 'total_itens', 'pago', 'receita_medica'
        )

    def get_cliente_nome(self, obj):
        if obj.cliente:
            return obj.cliente.get_full_name() or obj.cliente.email
        return "Consumidor Final"

    def get_total_itens(self, obj):
        return obj.itens.count()


class PedidoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalhes do pedido."""
    itens = ItemPedidoSerializer(many=True, read_only=True)
    farmacia_nome = serializers.CharField(source='farmacia.nome', read_only=True)
    farmacia_endereco = serializers.CharField(source='farmacia.endereco', read_only=True)
    farmacia_nuit = serializers.CharField(source='farmacia.nuit', read_only=True)
    cliente_nome = serializers.CharField(source='cliente.get_full_name', read_only=True)
    
    class Meta:
        model = Pedido
        fields = '__all__'
        read_only_fields = (
            'cliente', 'numero_pedido', 'uuid', 'qr_code', 
            'codigo_validacao', 'validado', 'data_criacao',
            'data_confirmacao', 'data_entrega', 'subtotal', 'total'
        ) 


class VendaBalcaoSerializer(serializers.Serializer):
    """Serializer simplificado para vendas no balcão (POS)."""
    
    itens = serializers.ListField(child=serializers.DictField())
    cliente = serializers.CharField(required=False, allow_blank=True)
    tipo_pagamento = serializers.ChoiceField(choices=Pedido.FormaPagamento.choices)
    receita_medica = serializers.ImageField(required=False, allow_null=True)
    
    def create(self, validated_data):
        user = self.context['request'].user
        itens_data = validated_data.get('itens')
        cliente_nome = validated_data.get('cliente', 'Consumidor Final')
        pagamento = validated_data.get('tipo_pagamento')
        
        # Validação de Estoque antes de criar
        for item in itens_data:
            try:
                estoque = EstoqueProduto.objects.get(id=item['estoque_id'], farmacia=user.farmacia)
                if estoque.quantidade < item['quantidade']:
                    raise serializers.ValidationError(f"Estoque insuficiente para {estoque.produto.nome}")
            except EstoqueProduto.DoesNotExist:
                raise serializers.ValidationError(f"Produto não encontrado no estoque.")

        with transaction.atomic():
            # 1. Criar o Pedido
            pedido = Pedido.objects.create(
                cliente=user, # Na venda balcão, o 'cliente' é o próprio user da farmácia por enquanto (ou um user 'Guest')
                farmacia=user.farmacia,
                status=Pedido.StatusPedido.ENTREGUE, # Já entregue
                forma_pagamento=pagamento,
                pago=True, # Já pago
                endereco_entrega="BALCÃO",
                bairro="-", cidade="-",
                telefone_contato="-",
                observacoes=f"Venda Balcão - Cliente: {cliente_nome}",
                receita_medica=validated_data.get('receita_medica')  # Upload de receita
            )
            
            # 2. Criar Itens e Baixar Estoque
            for item in itens_data:
                # Converter tipos para garantir
                item_qtd = int(item['quantidade'])
                item_preco = float(item['preco_unitario'])
                item_estoque_id = int(item['estoque_id'])

                estoque = EstoqueProduto.objects.get(id=item_estoque_id)
                
                # Criar ItemPedido
                ItemPedido.objects.create(
                    pedido=pedido,
                    produto=estoque.produto,
                    estoque=estoque,
                    quantidade=item_qtd,
                    preco_unitario=item_preco,
                    subtotal=item_qtd * item_preco
                )
                
                # Baixar Estoque
                estoque.quantidade -= item_qtd
                estoque.save()
            
            pedido.calcular_total()
            
            # Aqui no futuro: Criar Movimentação Financeira em 'financas'
            
            return pedido
