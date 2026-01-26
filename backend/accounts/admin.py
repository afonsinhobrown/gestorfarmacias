from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for custom User model."""
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Informações Pessoais'), {'fields': ('first_name', 'last_name', 'telefone', 'foto_perfil')}),
        (_('Tipo de Usuário'), {'fields': ('tipo_usuario',)}),
        (_('Endereço'), {'fields': ('endereco', 'cidade', 'provincia', 'codigo_postal')}),
        (_('Geolocalização'), {'fields': ('latitude', 'longitude')}),
        (_('Permissões'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verificado', 'groups', 'user_permissions'),
        }),
        (_('Datas Importantes'), {'fields': ('last_login', 'date_joined', 'data_criacao', 'data_atualizacao')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'tipo_usuario'),
        }),
    )
    list_display = ('email', 'get_full_name', 'tipo_usuario', 'is_verificado', 'is_active', 'data_criacao')
    list_filter = ('tipo_usuario', 'is_staff', 'is_superuser', 'is_active', 'is_verificado')
    search_fields = ('email', 'first_name', 'last_name', 'telefone')
    ordering = ('-data_criacao',)
    readonly_fields = ('data_criacao', 'data_atualizacao', 'last_login', 'date_joined')
