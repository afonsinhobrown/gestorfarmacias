from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from farmacias.models import Farmacia

class Caixa(models.Model):
    """Representa um terminal físico ou virtual de caixa na farmácia."""
    farmacia = models.ForeignKey(Farmacia, on_delete=models.CASCADE, related_name='caixas')
    nome = models.CharField(_('nome do caixa'), max_length=100, help_text="Ex: Caixa 01, Balcão Principal")
    codigo = models.CharField(_('código'), max_length=20, unique=True)
    is_ativo = models.BooleanField(_('ativo'), default=True)
    
    class Meta:
        verbose_name = _('caixa')
        verbose_name_plural = _('caixas')
        unique_together = ['farmacia', 'nome']

    def __str__(self):
        return f"{self.nome} - {self.farmacia.nome}"

class SessaoCaixa(models.Model):
    """Representa um turno/sessão de trabalho de um operador em um caixa."""
    
    class StatusSessao(models.TextChoices):
        ABERTO = 'ABERTO', _('Aberto')
        FECHADO = 'FECHADO', _('Fechado')
        CONCILIADO = 'CONCILIADO', _('Conciliado pelo Gestor')

    caixa = models.ForeignKey(Caixa, on_delete=models.PROTECT, related_name='sessoes')
    operador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='sessoes_caixa')
    
    # Horários
    data_abertura = models.DateTimeField(_('data de abertura'), auto_now_add=True)
    data_fechamento = models.DateTimeField(_('data de fechamento'), null=True, blank=True)
    
    # Valores de Abertura (Fundo de Maneio)
    valor_abertura = models.DecimalField(_('valor de abertura'), max_digits=12, decimal_places=2, default=0)
    
    # Valores de Fechamento (Declarados pelo Operador) - Estilo Primavera
    valor_declarado_dinheiro = models.DecimalField(_('dinheiro declarado'), max_digits=12, decimal_places=2, default=0)
    valor_declarado_pos = models.DecimalField(_('cartão/POS declarado'), max_digits=12, decimal_places=2, default=0)
    valor_declarado_mpesa = models.DecimalField(_('M-Pesa declarado'), max_digits=12, decimal_places=2, default=0)
    valor_declarado_emola = models.DecimalField(_('e-Mola declarado'), max_digits=12, decimal_places=2, default=0)
    valor_declarado_outros = models.DecimalField(_('outros declarado'), max_digits=12, decimal_places=2, default=0)
    
    # Valores de Fechamento (Calculados pelo Sistema)
    valor_sistema_dinheiro = models.DecimalField(_('dinheiro sistema'), max_digits=12, decimal_places=2, default=0)
    valor_sistema_pos = models.DecimalField(_('cartão/POS sistema'), max_digits=12, decimal_places=2, default=0)
    valor_sistema_mpesa = models.DecimalField(_('M-Pesa sistema'), max_digits=12, decimal_places=2, default=0)
    valor_sistema_emola = models.DecimalField(_('e-Mola sistema'), max_digits=12, decimal_places=2, default=0)
    valor_sistema_outros = models.DecimalField(_('outros sistema'), max_digits=12, decimal_places=2, default=0)
    
    # Totais
    total_declarado = models.DecimalField(_('total declarado'), max_digits=12, decimal_places=2, default=0)
    total_sistema = models.DecimalField(_('total sistema'), max_digits=12, decimal_places=2, default=0)
    diferenca = models.DecimalField(_('diferença/quebra'), max_digits=12, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=StatusSessao.choices, default=StatusSessao.ABERTO)
    observacoes = models.TextField(_('observações'), blank=True)
    
    # SUPERANDO PRIMAVERA: Evidência Digital
    comprovante_fecho = models.ImageField(_('comprovante de fecho'), upload_to='caixas/fechos/', null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        verbose_name = _('sessão de caixa')
        verbose_name_plural = _('sessões de caixa')
        ordering = ['-data_abertura']

    def __str__(self):
        return f"Sessão {self.id} - {self.operador.first_name} ({self.status})"
    
    def calcular_diferencas(self):
        self.total_declarado = (
            self.valor_declarado_dinheiro + self.valor_declarado_pos + 
            self.valor_declarado_mpesa + self.valor_declarado_emola + 
            self.valor_declarado_outros
        )
        self.diferenca = self.total_declarado - self.total_sistema
        self.save()

class MovimentoCaixa(models.Model):
    """Registra entradas (Reforços) e saídas (Sangrias) de dinheiro durante o turno."""
    
    class TipoMovimento(models.TextChoices):
        REFORCO = 'REFORCO', _('Reforço (Entrada de Trocos)')
        SANGRIA = 'SANGRIA', _('Sangria (Retirada de Dinheiro)')
        PAGAMENTO = 'PAGAMENTO', _('Pagamento de Despesa no Caixa')

    sessao = models.ForeignKey(SessaoCaixa, on_delete=models.CASCADE, related_name='movimentos')
    tipo = models.CharField(max_length=20, choices=TipoMovimento.choices)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    motivo = models.CharField(max_length=255)
    data_hora = models.DateTimeField(auto_now_add=True)
    
    # Se for um pagamento, podemos linkar à despesa
    despesa = models.ForeignKey('financeiro.Despesa', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = _('movimento de caixa')
        verbose_name_plural = _('movimentos de caixa')
        ordering = ['-data_hora']
