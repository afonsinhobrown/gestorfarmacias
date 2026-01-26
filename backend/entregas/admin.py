from django.contrib import admin
from .models import Entregador, Entrega, RastreamentoEntrega, AvaliacaoEntrega


@admin.register(Entregador)
class EntregadorAdmin(admin.ModelAdmin):
    """Admin configuration for Entregador model."""
    
    list_display = (
        'usuario', 'tipo_veiculo', 'status', 'is_ativo', 
        'is_verificado', 'total_entregas', 'nota_media'
    )
    list_filter = (
        'status', 'tipo_veiculo', 'is_ativo', 'is_verificado',
        'cidade_atuacao' if hasattr(Entregador, 'cidade_atuacao') else 'status' # Fallback
    )
    search_fields = (
        'usuario__email', 'usuario__first_name', 'documento_identidade',
        'placa_veiculo'
    )
    readonly_fields = ('data_cadastro', 'data_atualizacao', 'nota_media', 'total_entregas', 'total_avaliacoes')
    
    fieldsets = (
        ('Usuário', {
            'fields': ('usuario',)
        }),
        ('Informações Pessoais', {
            'fields': ('documento_identidade', 'data_nascimento', 'foto_documento')
        }),
        ('Veículo', {
            'fields': ('tipo_veiculo', 'placa_veiculo', 'modelo_veiculo', 'cor_veiculo')
        }),
        ('Documentação', {
            'fields': ('carta_conducao', 'validade_carta')
        }),
        ('Status', {
            'fields': ('status', 'is_ativo', 'is_verificado')
        }),
        ('Localização Atual', {
            'fields': ('latitude_atual', 'longitude_atual', 'ultima_localizacao')
        }),
        ('Estatísticas', {
            'fields': ('total_entregas', 'nota_media', 'total_avaliacoes')
        }),
        ('Metadata', {
            'fields': ('data_cadastro', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )


class RastreamentoEntregaInline(admin.TabularInline):
    model = RastreamentoEntrega
    extra = 0
    readonly_fields = ('timestamp', 'latitude', 'longitude')
    max_num = 10  # Limit display to avoid overloading the page
    ordering = ('-timestamp',)


@admin.register(Entrega)
class EntregaAdmin(admin.ModelAdmin):
    """Admin configuration for Entrega model."""
    
    list_display = (
        'pedido', 'entregador', 'status', 'distancia_km',
        'tempo_estimado_minutos', 'data_criacao'
    )
    list_filter = ('status', 'data_criacao', 'entregador')
    search_fields = ('pedido__numero_pedido', 'entregador__usuario__first_name')
    readonly_fields = (
        'data_criacao', 'data_atribuicao', 'data_aceitacao',
        'data_coleta', 'data_inicio_transito', 'data_entrega',
        'data_cancelamento'
    )
    inlines = [RastreamentoEntregaInline]
    
    fieldsets = (
        ('Relacionamentos', {
            'fields': ('pedido', 'entregador')
        }),
        ('Status', {
            'fields': ('status', 'distancia_km', 'tempo_estimado_minutos')
        }),
        ('Coleta', {
            'fields': ('latitude_coleta', 'longitude_coleta', 'codigo_validacao_coleta', 'validado_coleta')
        }),
        ('Entrega', {
            'fields': ('latitude_entrega', 'longitude_entrega', 'codigo_validacao_entrega', 'validado_entrega', 'foto_comprovante')
        }),
        ('Observações', {
            'fields': ('observacoes', 'motivo_cancelamento', 'motivo_recusa')
        }),
        ('Datas', {
            'fields': ('data_criacao', 'data_atribuicao', 'data_aceitacao', 'data_coleta', 'data_inicio_transito', 'data_entrega', 'data_cancelamento')
        }),
    )


@admin.register(AvaliacaoEntrega)
class AvaliacaoEntregaAdmin(admin.ModelAdmin):
    """Admin configuration for AvaliacaoEntrega model."""
    
    list_display = ('entrega', 'nota', 'data_criacao')
    list_filter = ('nota', 'data_criacao')
    search_fields = ('entrega__pedido__numero_pedido', 'comentario')
    readonly_fields = ('data_criacao',)
