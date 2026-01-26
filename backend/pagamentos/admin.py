from django.contrib import admin
from .models import Pagamento, CartaoCredito, Reembolso, HistoricoPagamento


class HistoricoPagamentoInline(admin.TabularInline):
    model = HistoricoPagamento
    extra = 0
    readonly_fields = ('data_mudanca', 'status_anterior')
    can_delete = False


class ReembolsoInline(admin.StackedInline):
    model = Reembolso
    extra = 0
    readonly_fields = ('data_solicitacao',)


@admin.register(Pagamento)
class PagamentoAdmin(admin.ModelAdmin):
    """Admin configuration for Pagamento model."""
    
    list_display = (
        'numero_transacao', 'pedido', 'usuario', 'metodo', 
        'status', 'valor_total', 'data_criacao'
    )
    list_filter = ('status', 'metodo', 'data_criacao')
    search_fields = (
        'numero_transacao', 'pedido__numero_pedido', 
        'usuario__email', 'gateway_transacao_id'
    )
    readonly_fields = (
        'uuid', 'numero_transacao', 'valor_total', 'data_criacao',
        'data_processamento', 'data_aprovacao', 'data_recusa',
        'data_cancelamento', 'data_reembolso', 'gateway_resposta'
    )
    inlines = [ReembolsoInline, HistoricoPagamentoInline]
    
    fieldsets = (
        ('Identificação', {
            'fields': ('uuid', 'numero_transacao', 'pedido', 'usuario')
        }),
        ('Pagamento', {
            'fields': ('metodo', 'status', 'gateway_transacao_id')
        }),
        ('Valores', {
            'fields': ('valor', 'taxa_processamento', 'valor_total')
        }),
        ('Datas', {
            'fields': ('data_criacao', 'data_processamento', 'data_aprovacao', 'data_recusa', 'data_cancelamento', 'data_reembolso')
        }),
        ('Detalhes Técnicos', {
            'fields': ('gateway_resposta', 'observacoes', 'motivo_recusa', 'motivo_cancelamento'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CartaoCredito)
class CartaoCreditoAdmin(admin.ModelAdmin):
    """Admin configuration for CartaoCredito model."""
    
    list_display = (
        'bandeira', 'ultimos_digitos', 'nome_titular', 
        'usuario', 'is_principal', 'is_ativo'
    )
    list_filter = ('bandeira', 'is_ativo', 'is_principal')
    search_fields = ('usuario__email', 'nome_titular', 'ultimos_digitos')
    readonly_fields = ('data_criacao', 'data_atualizacao')
    
    fieldsets = (
        ('Usuário', {
            'fields': ('usuario',)
        }),
        ('Detalhes do Cartão', {
            'fields': ('token_gateway', 'bandeira', 'ultimos_digitos', 'nome_titular', 'mes_validade', 'ano_validade')
        }),
        ('Status', {
            'fields': ('is_principal', 'is_ativo')
        }),
        ('Metadata', {
            'fields': ('data_criacao', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Reembolso)
class ReembolsoAdmin(admin.ModelAdmin):
    """Admin configuration for Reembolso model."""
    
    list_display = ('pagamento', 'status', 'valor_solicitado', 'valor_aprovado', 'data_solicitacao')
    list_filter = ('status', 'data_solicitacao')
    search_fields = ('pagamento__numero_transacao', 'motivo')
    readonly_fields = ('data_solicitacao', 'data_analise', 'data_aprovacao', 'data_conclusao', 'data_recusa')
