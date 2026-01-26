from django.db import models
from django.utils.translation import gettext_lazy as _
from farmacias.models import Farmacia
from django.conf import settings

class Funcionario(models.Model):
    """Cadastro de Funcionários (RH)."""
    
    class Cargo(models.TextChoices):
        FARMACEUTICO = 'FARMACEUTICO', _('Farmacêutico')
        ATENDENTE = 'ATENDENTE', _('Atendente de Balcão')
        CAIXA = 'CAIXA', _('Operador de Caixa')
        GERENTE = 'GERENTE', _('Gerente')
        ENTREGADOR = 'ENTREGADOR', _('Entregador')
        LIMPEZA = 'LIMPEZA', _('Auxiliar de Limpeza')
        QUARDA = 'GUARDA', _('Guarda/Segurança')
        OUTRO = 'OUTRO', _('Outro')

    nome = models.CharField(_('nome completo'), max_length=200)
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='funcionario_perfil',
        verbose_name=_('usuário do sistema'),
        help_text=_('Vincular se o funcionário usa o sistema')
    )
    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name='funcionarios',
        verbose_name=_('farmácia')
    )
    
    # Dados Contratuais
    cargo = models.CharField(_('cargo'), max_length=50, choices=Cargo.choices)
    salario_base = models.DecimalField(_('salário base'), max_digits=10, decimal_places=2)
    data_admissao = models.DateField(_('data de admissão'))
    ativo = models.BooleanField(_('ativo'), default=True)
    
    # Contato
    telefone = models.CharField(_('telefone'), max_length=20)
    email = models.EmailField(_('email'), blank=True)
    nuit = models.CharField(_('NUIT'), max_length=20, blank=True)
    endereco = models.TextField(_('endereço'), blank=True)
    
    def __str__(self):
        return f"{self.nome} ({self.get_cargo_display()})"

class FolhaPagamento(models.Model):
    """Registro de Pagamentos de Salário."""
    
    funcionario = models.ForeignKey(
        Funcionario, 
        on_delete=models.PROTECT,
        related_name='pagamentos'
    )
    mes_referencia = models.DateField(_('mês de referência'), help_text=_('Dia 1 do mês referente'))
    
    salario_base = models.DecimalField(_('salário base'), max_digits=10, decimal_places=2)
    bonus = models.DecimalField(_('bônus/comissões'), max_digits=10, decimal_places=2, default=0)
    descontos = models.DecimalField(_('descontos/faltas'), max_digits=10, decimal_places=2, default=0)
    
    total_liquido = models.DecimalField(_('total líquido'), max_digits=10, decimal_places=2)
    
    data_pagamento = models.DateField(_('data do pagamento'))
    pago = models.BooleanField(_('pago'), default=False)
    
    # Integração Financeira
    despesa_vinculada = models.OneToOneField(
        'financeiro.Despesa',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='folha_origem'
    )
    
    def save(self, *args, **kwargs):
        self.total_liquido = self.salario_base + self.bonus - self.descontos
        super().save(*args, **kwargs)
        
        # Gerar Despesa Automaticamente ao confirmar pagamento
        if self.pago and not self.despesa_vinculada:
            from financeiro.models import Despesa, CategoriaDespesa
            
            # Buscar ou criar categoria "Salários"
            cat, _ = CategoriaDespesa.objects.get_or_create(
                nome='Salários e Ordenados',
                defaults={'descricao': 'Pagamentos de funcionários'}
            )
            
            despesa = Despesa.objects.create(
                farmacia=self.funcionario.farmacia,
                categoria=cat,
                titulo=f"Salário - {self.funcionario.nome} ({self.mes_referencia.strftime('%m/%Y')})",
                valor=self.total_liquido,
                data_vencimento=self.data_pagamento,
                data_pagamento=self.data_pagamento,
                status=Despesa.StatusDespesa.PAGO,
                is_recorrente=True
            )
            self.despesa_vinculada = despesa
            self.save(update_fields=['despesa_vinculada'])
