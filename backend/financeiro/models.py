from django.db import models
from django.utils.translation import gettext_lazy as _
from farmacias.models import Farmacia
from django.conf import settings

class CategoriaDespesa(models.Model):
    """Categoria para classificação de despesas (ex: Salários, Luz, Água, Aluguel)."""
    
    nome = models.CharField(_('nome'), max_length=100)
    descricao = models.TextField(_('descrição'), blank=True)
    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name='categorias_despesa',
        verbose_name=_('farmácia'),
        null=True,
        blank=True,
        help_text=_('Se nulo, é uma categoria padrão do sistema')
    )
    
    class Meta:
        verbose_name = _('categoria de despesa')
        verbose_name_plural = _('categorias de despesas')
        ordering = ['nome']
        unique_together = ['nome', 'farmacia']

    def __str__(self):
        return self.nome


class Despesa(models.Model):
    """Modelo para registro de despesas operacionais e custos."""
    
    class StatusDespesa(models.TextChoices):
        PENDENTE = 'PENDENTE', _('Pendente')
        PAGO = 'PAGO', _('Pago')
        CANCELADO = 'CANCELADO', _('Cancelado')
        
    class MetodoPagamento(models.TextChoices):
        DINHEIRO = 'DINHEIRO', _('Dinheiro')
        TRANSFERENCIA = 'TRANSFERENCIA', _('Transferência Bancária')
        MPESA = 'MPESA', _('M-Pesa')
        EMOLA = 'EMOLA', _('E-Mola')
        CARTAO = 'CARTAO', _('Cartão (POS)')
        CHEQUE = 'CHEQUE', _('Cheque')
        OUTRO = 'OUTRO', _('Outro')

    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name='despesas',
        verbose_name=_('farmácia')
    )
    
    categoria = models.ForeignKey(
        CategoriaDespesa,
        on_delete=models.PROTECT,
        related_name='despesas',
        verbose_name=_('categoria')
    )
    
    titulo = models.CharField(_('título'), max_length=200, help_text=_('Ex: Conta de Luz Janeiro'))
    valor = models.DecimalField(_('valor'), max_digits=12, decimal_places=2)
    
    data_vencimento = models.DateField(_('data de vencimento'))
    data_pagamento = models.DateField(_('data de pagamento'), null=True, blank=True)
    
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=StatusDespesa.choices,
        default=StatusDespesa.PENDENTE
    )
    
    metodo_pagamento = models.CharField(
        _('método de pagamento'),
        max_length=20,
        choices=MetodoPagamento.choices,
        null=True,
        blank=True
    )
    
    observacoes = models.TextField(_('observações'), blank=True)
    comprovante = models.FileField(_('comprovante'), upload_to='despesas/comprovantes/', null=True, blank=True)
    
    # Recorrência
    is_recorrente = models.BooleanField(_('é recorrente (mensal)'), default=False, help_text=_('Marque para despesas fixas como Salário, Aluguel'))
    dia_vencimento_recorrente = models.PositiveSmallIntegerField(_('dia de vencimento'), null=True, blank=True, help_text=_('Dia do mês para gerar próxima cobrança (1-31)'))
    
    # Metadados
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='despesas_criadas'
    )
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('despesa')
        verbose_name_plural = _('despesas')
        ordering = ['-data_vencimento']

    def __str__(self):
        return f"{self.titulo} - {self.valor} ({self.get_status_display()})"
    
    def marcar_como_paga(self):
        from django.utils import timezone
        if self.status != self.StatusDespesa.PAGO:
            self.status = self.StatusDespesa.PAGO
            if not self.data_pagamento:
                self.data_pagamento = timezone.now().date()
            self.save()
