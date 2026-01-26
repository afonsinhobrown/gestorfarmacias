from django.contrib import admin
from .models import CategoriaProduto, Produto, EstoqueProduto, MovimentacaoEstoque


@admin.register(CategoriaProduto)
class CategoriaProdutoAdmin(admin.ModelAdmin):
    """Admin configuration for CategoriaProduto model."""
    
    list_display = ('nome', 'ordem', 'is_ativa')
    list_filter = ('is_ativa',)
    search_fields = ('nome', 'descricao')
    ordering = ('ordem', 'nome')


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    """Admin configuration for Produto model."""
    
    list_display = ('nome', 'codigo_barras', 'categoria', 'tipo', 'fabricante', 'requer_receita', 'is_ativo')
    list_filter = ('tipo', 'categoria', 'requer_receita', 'controlado', 'is_ativo')
    search_fields = ('nome', 'nome_generico', 'codigo_barras', 'codigo_interno', 'fabricante')
    readonly_fields = ('data_criacao', 'data_atualizacao')
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'nome_generico', 'codigo_barras', 'codigo_interno')
        }),
        ('Categoria e Tipo', {
            'fields': ('categoria', 'tipo')
        }),
        ('Descrição', {
            'fields': ('descricao', 'composicao', 'indicacao', 'contraindicacao', 'posologia')
        }),
        ('Especificações', {
            'fields': ('fabricante', 'pais_origem')
        }),
        ('Regulamentação', {
            'fields': ('requer_receita', 'controlado', 'registro_ministerio')
        }),
        ('Apresentação', {
            'fields': ('forma_farmaceutica', 'concentracao', 'quantidade_embalagem')
        }),
        ('Imagem', {
            'fields': ('imagem_principal',)
        }),
        ('Status', {
            'fields': ('is_ativo',)
        }),
        ('Metadata', {
            'fields': ('data_criacao', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EstoqueProduto)
class EstoqueProdutoAdmin(admin.ModelAdmin):
    """Admin configuration for EstoqueProduto model."""
    
    list_display = ('produto', 'farmacia', 'quantidade', 'preco_venda', 'em_promocao', 'is_disponivel', 'estoque_baixo')
    list_filter = ('is_disponivel', 'em_promocao', 'farmacia')
    search_fields = ('produto__nome', 'farmacia__nome', 'lote')
    readonly_fields = ('data_criacao', 'data_atualizacao')
    
    fieldsets = (
        ('Relacionamentos', {
            'fields': ('farmacia', 'produto')
        }),
        ('Estoque', {
            'fields': ('quantidade', 'quantidade_minima', 'lote', 'data_fabricacao', 'data_validade')
        }),
        ('Preços', {
            'fields': ('preco_custo', 'preco_venda', 'preco_promocional', 'em_promocao')
        }),
        ('Localização', {
            'fields': ('localizacao_estoque',)
        }),
        ('Status', {
            'fields': ('is_disponivel',)
        }),
        ('Metadata', {
            'fields': ('data_criacao', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )
    
    def estoque_baixo(self, obj):
        return obj.estoque_baixo
    estoque_baixo.boolean = True
    estoque_baixo.short_description = 'Estoque Baixo'


@admin.register(MovimentacaoEstoque)
class MovimentacaoEstoqueAdmin(admin.ModelAdmin):
    """Admin configuration for MovimentacaoEstoque model."""
    
    list_display = ('estoque', 'tipo', 'quantidade', 'quantidade_anterior', 'quantidade_nova', 'data_movimentacao')
    list_filter = ('tipo', 'data_movimentacao')
    search_fields = ('estoque__produto__nome', 'motivo', 'observacoes')
    readonly_fields = ('data_movimentacao',)
    date_hierarchy = 'data_movimentacao'
