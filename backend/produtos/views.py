from rest_framework import generics, permissions, filters, status, serializers, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import CategoriaProduto, Produto, EstoqueProduto
from .serializers import (
    CategoriaProdutoSerializer, ProdutoSerializer, 
    CategoriaProdutoSerializer, ProdutoSerializer, 
    EstoqueFarmaciaSerializer, EstoqueGestaoSerializer,
    BuscaGlobalSerializer
)
from django.db.models import Q
from django.utils import timezone

class BuscaGlobalView(generics.ListAPIView):
    """
    Busca pública de medicamentos em todas as farmácias.
    Query params:
        q: termo de busca (nome do produto ou genérico)
    """
    serializer_class = BuscaGlobalSerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        from django.db.models import Case, When, Value, IntegerField
        from prioridade.models import AssinaturaPrioridade
        from django.utils import timezone
        
        # Buscar farmácias com prioridade ativa
        farmacias_prioritarias = AssinaturaPrioridade.objects.filter(
            status='ATIVA',
            data_fim__gte=timezone.now()
        ).values_list('farmacia_id', flat=True)
        
        queryset = EstoqueProduto.objects.filter(
            quantidade__gt=0,
            is_disponivel=True,
            farmacia__is_ativa=True,
            produto__is_ativo=True
        ).select_related('produto', 'farmacia', 'produto__categoria')
        
        termo = self.request.query_params.get('q', None)
        if termo:
            queryset = queryset.filter(
                Q(produto__nome__icontains=termo) | 
                Q(produto__nome_generico__icontains=termo) |
                Q(produto__descricao__icontains=termo)
            )
        
        # Ordenar: 1) Farmácias com prioridade, 2) Resto, 3) Por preço
        queryset = queryset.annotate(
            tem_prioridade=Case(
                When(farmacia_id__in=farmacias_prioritarias, then=Value(0)),
                default=Value(1),
                output_field=IntegerField()
            )
        ).order_by('tem_prioridade', 'preco_venda')
        
        return queryset


class CategoriaListView(generics.ListAPIView):
    """Lista todas as categorias ativas."""
    queryset = CategoriaProduto.objects.filter(is_ativa=True).order_by('ordem', 'nome')
    serializer_class = CategoriaProdutoSerializer
    permission_classes = (permissions.AllowAny,)


class ProdutoListView(generics.ListCreateAPIView):
    """Lista o catálogo global de produtos ou adiciona novo."""
    queryset = Produto.objects.filter(is_ativo=True)
    serializer_class = ProdutoSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('categoria', 'tipo', 'requer_receita', 'is_isento_iva')
    search_fields = ('nome', 'nome_generico', 'fabricante', 'indicacao')
    ordering_fields = ('nome', 'fabricante')


class ProdutoDetailView(generics.RetrieveUpdateAPIView):
    """Detalhes e Atualização de um produto."""
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)


class ProdutoDisponibilidadeView(generics.ListAPIView):
    """
    Lista em quais farmácias um produto específico está disponível (com preço).
    Útil para o marketplace: "Onde encontrar este remédio?"
    """
    serializer_class = EstoqueFarmaciaSerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        produto_id = self.kwargs.get('pk')
        # Retorna apenas estoques com quantidade > 0 e de farmácias ativas
        return EstoqueProduto.objects.filter(
            produto_id=produto_id,
            quantidade__gt=0,
            is_disponivel=True,
            farmacia__is_ativa=True
        ).select_related('farmacia')


class EstoqueFarmaciaListView(generics.ListCreateAPIView):
    """
    Endpoint para a farmácia gerenciar seu próprio estoque.
    Lista todos os produtos da farmácia logada ou adiciona novo.
    """
    serializer_class = EstoqueGestaoSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = (filters.SearchFilter,)
    search_fields = ('produto__nome', 'produto__codigo_barras', 'lote')

    def get_queryset(self):
        # Filtra pelo usuário logado que deve ser dono de uma farmácia
        if hasattr(self.request.user, 'farmacia'):
            return EstoqueProduto.objects.filter(farmacia=self.request.user.farmacia)
        return EstoqueProduto.objects.none()

    def post(self, request, *args, **kwargs):
        print("--- DEBUG POST LOAD ---")
        print(request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("--- ERROS DE VALIDAÇÃO ---")
            print(serializer.errors)
            print("--------------------------")
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'farmacia'):
            serializer.save(farmacia=self.request.user.farmacia)
        else:
            raise serializers.ValidationError("Usuário não possui farmácia vinculada.")

class EstoqueFarmaciaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Visualiza, atualiza e remove um item do estoque da farmácia."""
    serializer_class = EstoqueGestaoSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if hasattr(self.request.user, 'farmacia'):
            return EstoqueProduto.objects.filter(farmacia=self.request.user.farmacia)
        return EstoqueProduto.objects.none()

# --- Entradas de Estoque ---
from .models import EntradaEstoque
from .serializers import EntradaEstoqueSerializer

class EntradaEstoqueViewSet(viewsets.ModelViewSet):
    """Gestão de Entradas de Estoque (Compras)."""
    serializer_class = EntradaEstoqueSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = EntradaEstoque.objects.filter(farmacia=self.request.user.farmacia)
        # Otimização
        if self.action == 'retrieve' or self.action == 'list':
            qs = qs.select_related('fornecedor').prefetch_related('itens__produto')
        return qs

class AjusteEstoqueView(APIView):
    """Realizar ajuste manual de estoque (Perdas, Quebras, Inventário)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        estoque_id = request.data.get('estoque_id')
        quantidade = int(request.data.get('quantidade', 0))
        motivo = request.data.get('motivo', 'Ajuste Manual')
        tipo = request.data.get('tipo', 'SAIDA') # SAIDA ou ENTRADA
        
        if not estoque_id or quantidade <= 0:
            return Response({'error': 'Dados inválidos'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from django.db import transaction
            from .models import MovimentacaoEstoque
            from financeiro.models import Despesa, CategoriaDespesa
            
            with transaction.atomic():
                estoque = EstoqueProduto.objects.select_for_update().get(
                    id=estoque_id, 
                    farmacia=request.user.farmacia
                )
                
                qtd_anterior = estoque.quantidade
                
                if tipo == 'SAIDA':
                    if estoque.quantidade < quantidade:
                        return Response({'error': 'Estoque insuficiente.'}, status=400)
                    estoque.quantidade -= quantidade
                    
                    # Gerar Prejuízo no Financeiro ??
                    # Se for PERDA ou QUEBRA ou VENCIMENTO
                    if motivo in ['QUEBRA', 'VENCIMENTO', 'ROUBO']:
                        valor_perda = quantidade * estoque.preco_custo
                        cat_perda, _ = CategoriaDespesa.objects.get_or_create(
                            nome='Perdas e Quebras de Estoque',
                            defaults={'descricao': 'Prejuízos com mercadoria'}
                        )
                        Despesa.objects.create(
                            farmacia=request.user.farmacia,
                            categoria=cat_perda,
                            titulo=f"Perda de Estoque - {estoque.produto.nome}",
                            valor=valor_perda,
                            data_vencimento=timezone.now().date(),
                            data_pagamento=timezone.now().date(),
                            status='PAGO', # Já foi uma perda consumada
                            observacoes=f"{motivo} - Qtd: {quantidade} - Lote: {estoque.lote}",
                            criado_por=request.user
                        )
                    
                elif tipo == 'ENTRADA':
                    estoque.quantidade += quantidade
                
                estoque.save()
                
                # Kardex
                MovimentacaoEstoque.objects.create(
                    estoque=estoque,
                    tipo=tipo,
                    quantidade=quantidade,
                    quantidade_anterior=qtd_anterior,
                    quantidade_nova=estoque.quantidade,
                    custo_unitario=estoque.preco_custo,
                    usuario=request.user,
                    motivo=motivo,
                    referencia_externa="AJUSTE MANUAL"
                )
                
                return Response({'status': 'ok', 'nova_quantidade': estoque.quantidade})
                
        except EstoqueProduto.DoesNotExist:
            return Response({'error': 'Estoque não encontrado'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class EstoqueHistoricoView(generics.ListAPIView):
    """Retorna o Kardex (histórico) de um item de estoque específico."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        from .models import MovimentacaoEstoque # Import local para garantir
        estoque_id = self.kwargs['pk']
        return MovimentacaoEstoque.objects.filter(
            estoque_id=estoque_id,
            estoque__farmacia=self.request.user.farmacia
        ).order_by('-data_movimentacao')
        
    def get_serializer_class(self):
        from .models import MovimentacaoEstoque
        class KardexSerializer(serializers.ModelSerializer):
            usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
            class Meta:
                model = MovimentacaoEstoque
                fields = (
                    'id', 'data_movimentacao', 'tipo', 'quantidade', 
                    'quantidade_anterior', 'quantidade_nova', 
                    'custo_unitario', 'motivo', 'referencia_externa', 'usuario_nome'
                )
        return KardexSerializer

class ReajustePrecoView(APIView):
    """Alterar preço de venda de um produto e registrar no histórico."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        estoque_id = request.data.get('estoque_id')
        novo_preco = request.data.get('novo_preco')
        
        if not estoque_id or not novo_preco:
            return Response({'error': 'ID e novo preço são obrigatórios'}, status=400)
            
        try:
            from .models import MovimentacaoEstoque, EstoqueProduto
            from django.db import transaction
            
            with transaction.atomic():
                estoque = EstoqueProduto.objects.select_for_update().get(
                    id=estoque_id, farmacia=request.user.farmacia
                )
                
                preco_antigo = estoque.preco_venda
                estoque.preco_venda = float(novo_preco)
                estoque.save()
                
                # Registrar no Kardex (Qtd 0, apenas log de preço)
                MovimentacaoEstoque.objects.create(
                    estoque=estoque,
                    tipo='AJUSTE',
                    quantidade=0,
                    quantidade_anterior=estoque.quantidade,
                    quantidade_nova=estoque.quantidade,
                    custo_unitario=estoque.preco_custo,
                    usuario=request.user,
                    motivo=f"PREÇO: {preco_antigo} -> {novo_preco}",
                    referencia_externa="REAJUSTE PREÇO"
                )
                
            return Response({'status': 'ok', 'novo_preco': estoque.preco_venda})
            
                
            return Response({'status': 'ok', 'novo_preco': estoque.preco_venda})
            
        except EstoqueProduto.DoesNotExist:
            return Response({'error': 'Produto não encontrado'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class TransferenciaEstoqueView(APIView):
    """Transferir estoque entre Loja e Armazém."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        estoque_origem_id = request.data.get('estoque_id')
        destino_local = request.data.get('destino') # LOJA ou ARMAZEM
        quantidade = int(request.data.get('quantidade', 0))
        
        if not estoque_origem_id or not destino_local or quantidade <= 0:
            return Response({'error': 'Dados incompletos'}, status=400)
            
        try:
            from django.db import transaction
            from .models import MovimentacaoEstoque, EstoqueProduto
            
            with transaction.atomic():
                origem = EstoqueProduto.objects.select_for_update().get(
                    id=estoque_origem_id, farmacia=request.user.farmacia
                )
                
                if origem.quantidade < quantidade:
                    return Response({'error': 'Quantidade insuficiente na origem'}, status=400)
                
                if origem.local == destino_local:
                    return Response({'error': 'Origem e destino são o mesmo local'}, status=400)
                
                # Buscar ou criar destino
                destino, created = EstoqueProduto.objects.select_for_update().get_or_create(
                    farmacia=origem.farmacia,
                    produto=origem.produto,
                    lote=origem.lote,
                    local=destino_local,
                    defaults={
                        'preco_custo': origem.preco_custo,
                        'preco_venda': origem.preco_venda,
                        'data_fabricacao': origem.data_fabricacao,
                        'data_validade': origem.data_validade,
                        'quantidade': 0
                    }
                )
                
                # Movimentação
                origem_qtd_ant = origem.quantidade
                destino_qtd_ant = destino.quantidade
                
                origem.quantidade -= quantidade
                destino.quantidade += quantidade
                
                origem.save()
                destino.save()
                
                # Kardex Origem
                MovimentacaoEstoque.objects.create(
                    estoque=origem,
                    tipo='TRANSFERENCIA',
                    quantidade=quantidade,
                    quantidade_anterior=origem_qtd_ant,
                    quantidade_nova=origem.quantidade,
                    usuario=request.user,
                    motivo=f"Transferência para {destino_local}",
                    referencia_externa=f"DESTINO ID: {destino.id}"
                )
                
                # Kardex Destino
                MovimentacaoEstoque.objects.create(
                    estoque=destino,
                    tipo='TRANSFERENCIA',
                    quantidade=quantidade,
                    quantidade_anterior=destino_qtd_ant,
                    quantidade_nova=destino.quantidade,
                    usuario=request.user,
                    motivo=f"Transferência de {origem.local}",
                    referencia_externa=f"ORIGEM ID: {origem.id}"
                )
                
            return Response({'status': 'ok', 'origem_nova_qtd': origem.quantidade, 'destino_nova_qtd': destino.quantidade})
            
        except EstoqueProduto.DoesNotExist:
            return Response({'error': 'Produto não encontrado'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class MovimentacaoFarmaciaView(generics.ListAPIView):
    """Lista TODAS as movimentações de estoque da farmácia (Kardex Global)."""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('estoque__produto__nome', 'motivo', 'referencia_externa')
    ordering = ('-data_movimentacao',)

    def get_queryset(self):
        from .models import MovimentacaoEstoque
        return MovimentacaoEstoque.objects.filter(
            estoque__farmacia=self.request.user.farmacia
        ).select_related('estoque', 'estoque__produto', 'usuario')

    def get_serializer_class(self):
        from .models import MovimentacaoEstoque
        class KardexGlobalSerializer(serializers.ModelSerializer):
            usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
            produto_nome = serializers.CharField(source='estoque.produto.nome', read_only=True)
            local = serializers.CharField(source='estoque.local', read_only=True)
            
            class Meta:
                model = MovimentacaoEstoque
                fields = (
                    'id', 'data_movimentacao', 'produto_nome', 'local', 'tipo', 
                    'quantidade', 'quantidade_anterior', 'quantidade_nova', 
                    'motivo', 'usuario_nome'
                )
        return KardexGlobalSerializer
