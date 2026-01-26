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


class ProdutoListView(generics.ListAPIView):
    """Lista o catálogo global de produtos."""
    queryset = Produto.objects.filter(is_ativo=True)
    serializer_class = ProdutoSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('categoria', 'tipo', 'requer_receita')
    search_fields = ('nome', 'nome_generico', 'fabricante', 'indicacao')
    ordering_fields = ('nome', 'fabricante')


class ProdutoDetailView(generics.RetrieveAPIView):
    """Detalhes de um produto."""
    queryset = Produto.objects.filter(is_ativo=True)
    serializer_class = ProdutoSerializer
    permission_classes = (permissions.AllowAny,)


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
    search_fields = ('produto__nome', 'lote')

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
            
        except EstoqueProduto.DoesNotExist:
            return Response({'error': 'Produto não encontrado'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
