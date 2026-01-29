from rest_framework import serializers
from .models import CategoriaProduto, Produto, EstoqueProduto, MovimentacaoEstoque
from farmacias.models import Farmacia

class CategoriaProdutoSerializer(serializers.ModelSerializer):
    """Serializer para categorias de produtos."""
    class Meta:
        model = CategoriaProduto
        fields = ('id', 'nome', 'descricao', 'icone', 'ordem')


class ProdutoSerializer(serializers.ModelSerializer):
    """Serializer para o catálogo de produtos (visão geral)."""
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    
    class Meta:
        model = Produto
        fields = (
            'id', 'nome', 'nome_generico', 'codigo_barras', 
            'categoria', 'categoria_nome', 'tipo',
            'descricao', 'composicao', 'fabricante',
            'requer_receita', 'forma_farmaceutica', 
            'concentracao', 'quantidade_embalagem',
            'unidade_medida', 'unidades_por_caixa',
            'permite_venda_avulsa', 'is_isento_iva', 'taxa_iva',
            'imagem_principal', 'is_ativo'
        )


class EstoqueFarmaciaSerializer(serializers.ModelSerializer):
    """Serializer de estoque com dados da farmácia (para o cliente ver quem tem o produto)."""
    farmacia_id = serializers.IntegerField(source='farmacia.id', read_only=True)
    farmacia_nome = serializers.CharField(source='farmacia.nome', read_only=True)
    farmacia_latitude = serializers.FloatField(source='farmacia.latitude', read_only=True)
    farmacia_longitude = serializers.FloatField(source='farmacia.longitude', read_only=True)
    preco_final = serializers.FloatField(read_only=True)
    
    class Meta:
        model = EstoqueProduto
        fields = (
            'id', 'farmacia_id', 'farmacia_nome', 
            'farmacia_latitude', 'farmacia_longitude',
            'preco_venda', 'preco_promocional', 
            'em_promocao', 'preco_final',
            'quantidade', 'is_disponivel', 'data_validade'
        )


class EstoqueGestaoSerializer(serializers.ModelSerializer):
    """Serializer para gestão de estoque pela farmácia."""
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    produto_codigo = serializers.CharField(source='produto.codigo_barras', read_only=True)
    unidades_por_caixa = serializers.IntegerField(source='produto.unidades_por_caixa', read_only=True)
    permite_venda_avulsa = serializers.BooleanField(source='produto.permite_venda_avulsa', read_only=True)
    percentual_comissao = serializers.DecimalField(source='produto.percentual_comissao', max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = EstoqueProduto
        fields = (
            'id', 'farmacia', 'produto', 'produto_nome', 'produto_codigo',
            'unidades_por_caixa', 'permite_venda_avulsa', 'percentual_comissao',
            'quantidade', 'quantidade_minima', 'lote', 'local',
            'data_fabricacao', 'data_validade', 'preco_custo', 
            'preco_venda', 'preco_promocional', 'preco_venda_avulso',
            'em_promocao', 'localizacao_estoque', 'is_disponivel'
        )
        read_only_fields = ('data_criacao', 'data_atualizacao', 'farmacia')


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    """Serializer para histórico de movimentações."""
    usuario_responsavel = serializers.CharField(source='usuario.get_full_name', read_only=True) # Assumindo futuro tracking de user
    
    class Meta:
        model = MovimentacaoEstoque
        fields = '__all__'
        read_only_fields = ('data_movimentacao',)

class BuscaGlobalSerializer(serializers.ModelSerializer):
    """
    Serializer otimizado para a busca global.
    Retorna dados do produto e da oferta (preço/farmácia) em um único objeto.
    """
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    produto_descricao = serializers.CharField(source='produto.descricao', read_only=True)
    produto_imagem = serializers.ImageField(source='produto.imagem_principal', read_only=True)
    produto_categoria = serializers.CharField(source='produto.categoria.nome', read_only=True)
    produto_fabricante = serializers.CharField(source='produto.fabricante', read_only=True)
    produto_concentracao = serializers.CharField(source='produto.concentracao', read_only=True)
    
    farmacia_nome = serializers.CharField(source='farmacia.nome', read_only=True)
    farmacia_endereco = serializers.CharField(source='farmacia.endereco', read_only=True)
    farmacia_bairro = serializers.CharField(source='farmacia.bairro', read_only=True)
    farmacia_logo = serializers.ImageField(source='farmacia.logotipo', read_only=True)
    farmacia_recomendada = serializers.SerializerMethodField()
    
    preco_final = serializers.FloatField(read_only=True)
    
    def get_farmacia_recomendada(self, obj):
        """Verifica se a farmácia tem prioridade ativa."""
        from prioridade.models import AssinaturaPrioridade
        from django.utils import timezone
        
        return AssinaturaPrioridade.objects.filter(
            farmacia=obj.farmacia,
            status='ATIVA',
            data_fim__gte=timezone.now()
        ).exists()

    class Meta:
        model = EstoqueProduto
        fields = (
            'id', 'produto_id', 'produto_nome', 'produto_descricao', 
            'produto_imagem', 'produto_categoria', 'produto_fabricante',
            'produto_concentracao',
            'farmacia_id', 'farmacia_nome', 'farmacia_endereco', 
            'farmacia_bairro', 'farmacia_logo', 'farmacia_recomendada',
            'preco_venda', 'preco_promocional', 'em_promocao', 'preco_final',
            'quantidade', 'is_disponivel'
        )

# --- Entrada de Estoque ---
from .models import EntradaEstoque, ItemEntrada
from financeiro.models import Despesa, CategoriaDespesa
from django.db import transaction

from django.utils import timezone

class ItemEntradaSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    
    class Meta:
        model = ItemEntrada
        fields = ('id', 'produto', 'produto_nome', 'quantidade', 'preco_custo_unitario', 'lote', 'data_validade', 'subtotal')
        read_only_fields = ('subtotal',)

class EntradaEstoqueSerializer(serializers.ModelSerializer):
    itens = ItemEntradaSerializer(many=True)
    fornecedor_nome = serializers.CharField(source='fornecedor.nome_fantasia', read_only=True)
    itens_count = serializers.IntegerField(source='itens.count', read_only=True)
    
    class Meta:
        model = EntradaEstoque
        fields = (
            'id', 'farmacia', 'fornecedor', 'fornecedor_nome', 'numero_nota', 
            'data_emissao', 'data_entrada', 'valor_total', 'arquivo_nota', 
            'observacoes', 'processada', 'financeiro_gerado', 'itens', 'itens_count'
        )
        read_only_fields = ('farmacia', 'processada', 'financeiro_gerado', 'criado_por')

    @transaction.atomic
    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        request = self.context.get('request')
        
        # Vincular à farmácia do usuário
        farmacia = request.user.farmacia
        validated_data['farmacia'] = farmacia
        validated_data['criado_por'] = request.user
        validated_data['processada'] = True # Processamos imediatamente
        validated_data['financeiro_gerado'] = True
        
        entrada = EntradaEstoque.objects.create(**validated_data)
        
        total_entrada = 0
        import uuid
        
        for item_data in itens_data:
            # Geração Automática de Lote (Sistema)
            # Formato: L-AAMMDD-4CHARS (Ex: L-260125-A1B2)
            suffix = str(uuid.uuid4())[:4].upper()
            data_str = timezone.now().strftime('%y%m%d')
            lote_gerado = f"L-{data_str}-{suffix}"
            
            # Forçar o lote gerado
            item_data['lote'] = lote_gerado
            
            item = ItemEntrada.objects.create(entrada=entrada, **item_data)
            total_entrada += (item.quantidade * item.preco_custo_unitario)
            
            # 1. Atualizar Estoque (Coração do Sistema)
            estoque, created = EstoqueProduto.objects.get_or_create(
                farmacia=farmacia,
                produto=item.produto,
                lote=item.lote,
                defaults={
                    'preco_custo': item.preco_custo_unitario, # Primeiro custo
                    'preco_venda': item.preco_custo_unitario * 1.5, # Margem padrão 50% se novo
                    'data_validade': item.data_validade
                }
            )
            
            # Salvar snapshot financeiro para Kardex
            custo_anterior = estoque.preco_custo
            
            # Atualizar custo médio ponderado
            # (QtdAtual * CustoAtual + QtdEntrada * CustoEntrada) / (QtdTotal)
            nova_qtd_total = estoque.quantidade + item.quantidade
            if not created and nova_qtd_total > 0:
                custo_total = (estoque.quantidade * estoque.preco_custo) + (item.quantidade * item.preco_custo_unitario)
                estoque.preco_custo = custo_total / nova_qtd_total
            
            estoque.quantidade += item.quantidade
            if item.data_validade: 
                estoque.data_validade = item.data_validade
            estoque.save()
            
            # 2. Gerar Kardex (Movimentação)
            MovimentacaoEstoque.objects.create(
                estoque=estoque,
                tipo='ENTRADA',
                quantidade=item.quantidade,
                quantidade_anterior=estoque.quantidade - item.quantidade,
                quantidade_nova=estoque.quantidade,
                custo_unitario=item.preco_custo_unitario,
                usuario=request.user,
                referencia_externa=f"Nota {entrada.numero_nota}",
                motivo="Entrada de Nota Fiscal / Compra"
            )

        # Atualizar total da entrada se não foi passado ou for diferente
        entrada.valor_total = total_entrada
        entrada.save()

        # 3. Gerar Conta a Pagar (Financeiro)
        # Buscar categoria "Fornecedores" ou criar
        cat_fornecedor, _ = CategoriaDespesa.objects.get_or_create(
            nome='Fornecedores de Medicamentos',
            defaults={'descricao': 'Pagamentos de compras de estoque'}
        )
        
        vencimento = entrada.data_emissao or timezone.now().date()
        # Se fornecedor tem prazo, calcular
        if entrada.fornecedor.prazo_pagamento_dias:
            from datetime import timedelta
            vencimento = vencimento + timedelta(days=entrada.fornecedor.prazo_pagamento_dias)

        Despesa.objects.create(
            farmacia=farmacia,
            categoria=cat_fornecedor,
            titulo=f"NF {entrada.numero_nota} - {entrada.fornecedor.nome_fantasia}",
            valor=total_entrada,
            data_vencimento=vencimento,
            status='PENDENTE',
            observacoes=f"Gerado automaticamente pela entrada de estoque #{entrada.id}",
            criado_por=request.user
        )

        return entrada
