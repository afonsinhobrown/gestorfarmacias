from django.contrib import admin
from .models import Caixa, SessaoCaixa, MovimentoCaixa

@admin.register(Caixa)
class CaixaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'codigo', 'farmacia', 'is_ativo')
    list_filter = ('farmacia', 'is_ativo')
    search_fields = ('nome', 'codigo')

@admin.register(SessaoCaixa)
class SessaoCaixaAdmin(admin.ModelAdmin):
    list_display = ('id', 'caixa', 'operador', 'data_abertura', 'status', 'total_sistema', 'total_declarado', 'diferenca')
    list_filter = ('status', 'caixa__farmacia', 'data_abertura')
    search_fields = ('operador__first_name', 'operador__last_name', 'caixa__nome')
    readonly_fields = ('data_abertura', 'total_sistema', 'diferenca')

@admin.register(MovimentoCaixa)
class MovimentoCaixaAdmin(admin.ModelAdmin):
    list_display = ('sessao', 'tipo', 'valor', 'motivo', 'data_hora')
    list_filter = ('tipo', 'data_hora')
