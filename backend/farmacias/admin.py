from django.contrib import admin
from .models import Farmacia, AvaliacaoFarmacia


@admin.register(Farmacia)
class FarmaciaAdmin(admin.ModelAdmin):
    """Admin configuration for Farmacia model."""
    
    list_display = ('nome', 'nuit', 'cidade', 'provincia', 'is_ativa', 'is_verificada', 'nota_media', 'total_avaliacoes')
    list_filter = ('is_ativa', 'is_verificada', 'aceita_entregas', 'funciona_24h', 'provincia', 'cidade')
    search_fields = ('nome', 'nome_fantasia', 'nuit', 'email', 'telefone_principal')
    readonly_fields = ('nota_media', 'total_avaliacoes', 'data_criacao', 'data_atualizacao')
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('usuario', 'nome', 'nome_fantasia', 'nuit', 'alvara')
        }),
        ('Contato', {
            'fields': ('telefone_principal', 'telefone_alternativo', 'email', 'website')
        }),
        ('Endereço', {
            'fields': ('endereco', 'bairro', 'cidade', 'provincia', 'codigo_postal')
        }),
        ('Geolocalização', {
            'fields': ('latitude', 'longitude')
        }),
        ('Horário de Funcionamento', {
            'fields': ('horario_abertura', 'horario_fechamento', 'funciona_24h')
        }),
        ('Informações Adicionais', {
            'fields': ('descricao', 'logo', 'foto_fachada')
        }),
        ('Configurações de Entrega', {
            'fields': ('aceita_entregas', 'raio_entrega_km', 'taxa_entrega')
        }),
        ('Status e Avaliação', {
            'fields': ('is_ativa', 'is_verificada', 'nota_media', 'total_avaliacoes')
        }),
        ('Metadata', {
            'fields': ('data_criacao', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AvaliacaoFarmacia)
class AvaliacaoFarmaciaAdmin(admin.ModelAdmin):
    """Admin configuration for AvaliacaoFarmacia model."""
    
    list_display = ('farmacia', 'usuario', 'nota', 'data_criacao')
    list_filter = ('nota', 'data_criacao')
    search_fields = ('farmacia__nome', 'usuario__email', 'comentario')
    readonly_fields = ('data_criacao',)
