from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import PlanoPrioridade, AssinaturaPrioridade, HistoricoPrioridade


@admin.register(PlanoPrioridade)
class PlanoPrioridadeAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo', 'duracao_dias', 'preco', 'ordem_prioridade', 'ativo']
    list_filter = ['tipo', 'ativo', 'duracao_dias']
    search_fields = ['nome', 'descricao']
    ordering = ['tipo', 'ordem_prioridade']


class HistoricoPrioridadeInline(admin.TabularInline):
    model = HistoricoPrioridade
    extra = 0
    readonly_fields = ['acao', 'usuario', 'data', 'detalhes']
    can_delete = False


@admin.register(AssinaturaPrioridade)
class AssinaturaPrioridadeAdmin(admin.ModelAdmin):
    list_display = [
        'get_entidade',
        'plano',
        'status_badge',
        'valor_pago',
        'data_solicitacao',
        'dias_restantes_display',
        'acoes_admin'
    ]
    list_filter = ['status', 'plano__tipo', 'data_solicitacao']
    search_fields = ['farmacia__nome', 'motoboy__usuario__email']
    readonly_fields = [
        'data_solicitacao',
        'data_aprovacao',
        'aprovado_por',
        'comprovativo_preview'
    ]
    inlines = [HistoricoPrioridadeInline]
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('plano', 'farmacia', 'motoboy', 'status')
        }),
        ('Pagamento', {
            'fields': ('valor_pago', 'comprovativo_pagamento', 'comprovativo_preview')
        }),
        ('Datas', {
            'fields': ('data_solicitacao', 'data_inicio', 'data_fim', 'data_aprovacao')
        }),
        ('Administração', {
            'fields': ('aprovado_por', 'observacoes_admin')
        }),
    )
    
    actions = ['aprovar_assinaturas', 'rejeitar_assinaturas']
    
    def get_entidade(self, obj):
        if obj.farmacia:
            return f"🏥 {obj.farmacia.nome}"
        elif obj.motoboy:
            return f"🏍️ {obj.motoboy.usuario.get_full_name()}"
        return "N/A"
    get_entidade.short_description = 'Entidade'
    
    def status_badge(self, obj):
        colors = {
            'PENDENTE': 'orange',
            'ATIVA': 'green',
            'EXPIRADA': 'gray',
            'CANCELADA': 'red',
            'REJEITADA': 'darkred',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def dias_restantes_display(self, obj):
        if obj.status == 'ATIVA':
            dias = obj.dias_restantes()
            if dias > 7:
                color = 'green'
            elif dias > 3:
                color = 'orange'
            else:
                color = 'red'
            return format_html(
                '<span style="color: {}; font-weight: bold;">{} dias</span>',
                color,
                dias
            )
        return '-'
    dias_restantes_display.short_description = 'Dias Restantes'
    
    def comprovativo_preview(self, obj):
        if obj.comprovativo_pagamento:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-width: 200px; max-height: 200px;"/></a>',
                obj.comprovativo_pagamento.url,
                obj.comprovativo_pagamento.url
            )
        return "Sem comprovativo"
    comprovativo_preview.short_description = 'Preview do Comprovativo'
    
    def acoes_admin(self, obj):
        if obj.status == 'PENDENTE':
            return format_html(
                '<a class="button" href="{}">Aprovar</a> '
                '<a class="button" href="{}">Rejeitar</a>',
                f'/admin/prioridade/assinaturaprioridade/{obj.pk}/aprovar/',
                f'/admin/prioridade/assinaturaprioridade/{obj.pk}/rejeitar/'
            )
        return '-'
    acoes_admin.short_description = 'Ações'
    
    def aprovar_assinaturas(self, request, queryset):
        count = 0
        for assinatura in queryset.filter(status='PENDENTE'):
            assinatura.aprovar(request.user)
            HistoricoPrioridade.objects.create(
                assinatura=assinatura,
                acao='Aprovação em massa',
                usuario=request.user,
                detalhes=f'Aprovado pelo admin {request.user.email}'
            )
            count += 1
        self.message_user(request, f'{count} assinatura(s) aprovada(s) com sucesso.')
    aprovar_assinaturas.short_description = 'Aprovar assinaturas selecionadas'
    
    def rejeitar_assinaturas(self, request, queryset):
        count = 0
        for assinatura in queryset.filter(status='PENDENTE'):
            assinatura.rejeitar(request.user, 'Rejeitado em massa')
            HistoricoPrioridade.objects.create(
                assinatura=assinatura,
                acao='Rejeição em massa',
                usuario=request.user,
                detalhes=f'Rejeitado pelo admin {request.user.email}'
            )
            count += 1
        self.message_user(request, f'{count} assinatura(s) rejeitada(s).')
    rejeitar_assinaturas.short_description = 'Rejeitar assinaturas selecionadas'


@admin.register(HistoricoPrioridade)
class HistoricoPrioridadeAdmin(admin.ModelAdmin):
    list_display = ['assinatura', 'acao', 'usuario', 'data']
    list_filter = ['acao', 'data']
    search_fields = ['assinatura__farmacia__nome', 'assinatura__motoboy__usuario__email']
    readonly_fields = ['assinatura', 'acao', 'usuario', 'data', 'detalhes']
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
