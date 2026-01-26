from django.contrib import admin
from .models import Pedido, ItemPedido, HistoricoPedido


class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0
    readonly_fields = ('subtotal',)


class HistoricoPedidoInline(admin.TabularInline):
    model = HistoricoPedido
    extra = 0
    readonly_fields = ('usuario', 'data_mudanca', 'status_anterior')
    can_delete = False


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    """Admin configuration for Pedido model."""
    
    list_display = (
        'numero_pedido', 'cliente', 'farmacia', 'status', 
        'total', 'data_criacao', 'pago', 'validado'
    )
    list_filter = (
        'status', 'pago', 'validado', 'forma_pagamento',
        'farmacia', 'data_criacao'
    )
    search_fields = (
        'numero_pedido', 'cliente__email', 'cliente__first_name',
        'farmacia__nome'
    )
    readonly_fields = (
        'numero_pedido', 'qrcode_coleta', 'qrcode_entrega', 'subtotal', 'total',
        'data_criacao', 'data_confirmacao', 'data_entrega',
        'data_cancelamento'
    )
    inlines = [ItemPedidoInline, HistoricoPedidoInline]
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_pedido', 'cliente', 'farmacia')
        }),
        ('Status e Pagamento', {
            'fields': ('status', 'forma_pagamento', 'pago')
        }),
        ('Valores', {
            'fields': ('subtotal', 'taxa_entrega', 'desconto', 'total')
        }),
        ('Entrega', {
            'fields': ('endereco_entrega', 'bairro', 'cidade', 'referencia', 'telefone_contato')
        }),
        ('Geolocalização', {
            'fields': ('latitude', 'longitude')
        }),
        ('Segurança (Coleta)', {
            'fields': ('qrcode_coleta', 'codigo_coleta', 'coletado_em')
        }),
        ('Segurança (Entrega)', {
            'fields': ('qrcode_entrega', 'codigo_entrega', 'validado', 'data_validacao')
        }),
        ('Observações', {
            'fields': ('observacoes', 'observacoes_farmacia')
        }),
        ('Cancelamento', {
            'fields': ('motivo_cancelamento',)
        }),
        ('Datas', {
            'fields': ('data_criacao', 'data_confirmacao', 'data_entrega_prevista', 'data_entrega', 'data_cancelamento')
        }),
    )


@admin.register(HistoricoPedido)
class HistoricoPedidoAdmin(admin.ModelAdmin):
    """Admin configuration for HistoricoPedido model."""
    
    list_display = ('pedido', 'status_anterior', 'status_novo', 'data_mudanca', 'usuario')
    list_filter = ('status_novo', 'data_mudanca')
    search_fields = ('pedido__numero_pedido', 'usuario__email')
    readonly_fields = ('data_mudanca',)
