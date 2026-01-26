from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from pedidos.models import Pedido
import uuid


class Pagamento(models.Model):
    """Payment model."""
    
    class MetodoPagamento(models.TextChoices):
        DINHEIRO = 'DINHEIRO', _('Dinheiro')
        CARTAO_CREDITO = 'CARTAO_CREDITO', _('Cartão de Crédito')
        CARTAO_DEBITO = 'CARTAO_DEBITO', _('Cartão de Débito')
        MPESA = 'MPESA', _('M-Pesa')
        EMOLA = 'EMOLA', _('E-Mola')
        TRANSFERENCIA = 'TRANSFERENCIA', _('Transferência Bancária')
        STRIPE = 'STRIPE', _('Stripe')
        PAYPAL = 'PAYPAL', _('PayPal')
    
    class StatusPagamento(models.TextChoices):
        PENDENTE = 'PENDENTE', _('Pendente')
        PROCESSANDO = 'PROCESSANDO', _('Processando')
        APROVADO = 'APROVADO', _('Aprovado')
        RECUSADO = 'RECUSADO', _('Recusado')
        CANCELADO = 'CANCELADO', _('Cancelado')
        REEMBOLSADO = 'REEMBOLSADO', _('Reembolsado')
        ERRO = 'ERRO', _('Erro')
    
    # Identificação
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    numero_transacao = models.CharField(_('número da transação'), max_length=100, unique=True, blank=True)
    
    # Relacionamentos
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='pagamentos',
        verbose_name=_('pedido')
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pagamentos',
        verbose_name=_('usuário')
    )
    
    # Método e status
    metodo = models.CharField(
        _('método de pagamento'),
        max_length=20,
        choices=MetodoPagamento.choices
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=StatusPagamento.choices,
        default=StatusPagamento.PENDENTE
    )
    
    # Valores
    valor = models.DecimalField(_('valor'), max_digits=10, decimal_places=2)
    taxa_processamento = models.DecimalField(_('taxa de processamento'), max_digits=10, decimal_places=2, default=0)
    valor_total = models.DecimalField(_('valor total'), max_digits=10, decimal_places=2)
    
    # Informações do gateway
    gateway_transacao_id = models.CharField(_('ID transação gateway'), max_length=200, blank=True)
    gateway_resposta = models.JSONField(_('resposta do gateway'), null=True, blank=True)
    
    # Timestamps
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    data_processamento = models.DateTimeField(_('data de processamento'), null=True, blank=True)
    data_aprovacao = models.DateTimeField(_('data de aprovação'), null=True, blank=True)
    data_recusa = models.DateTimeField(_('data de recusa'), null=True, blank=True)
    data_cancelamento = models.DateTimeField(_('data de cancelamento'), null=True, blank=True)
    data_reembolso = models.DateTimeField(_('data de reembolso'), null=True, blank=True)
    
    # Observações
    observacoes = models.TextField(_('observações'), blank=True)
    motivo_recusa = models.TextField(_('motivo de recusa'), blank=True)
    motivo_cancelamento = models.TextField(_('motivo de cancelamento'), blank=True)
    
    class Meta:
        verbose_name = _('pagamento')
        verbose_name_plural = _('pagamentos')
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Pagamento {self.numero_transacao} - {self.metodo}"
    
    def save(self, *args, **kwargs):
        if not self.numero_transacao:
            # Gerar número de transação
            from django.utils import timezone
            now = timezone.now()
            self.numero_transacao = f"PAG{now.strftime('%Y%m%d%H%M%S')}{str(self.uuid)[:8].upper()}"
        
        # Calcular valor total
        self.valor_total = self.valor + self.taxa_processamento
        
        super().save(*args, **kwargs)


class CartaoCredito(models.Model):
    """Credit card tokenization model."""
    
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cartoes',
        verbose_name=_('usuário')
    )
    
    # Informações tokenizadas (nunca armazenar dados reais do cartão)
    token_gateway = models.CharField(_('token do gateway'), max_length=200, unique=True)
    ultimos_digitos = models.CharField(_('últimos 4 dígitos'), max_length=4)
    bandeira = models.CharField(
        _('bandeira'),
        max_length=20,
        choices=[
            ('VISA', 'Visa'),
            ('MASTERCARD', 'Mastercard'),
            ('AMEX', 'American Express'),
            ('DISCOVER', 'Discover'),
            ('OUTRO', 'Outro'),
        ]
    )
    nome_titular = models.CharField(_('nome do titular'), max_length=200)
    mes_validade = models.PositiveSmallIntegerField(_('mês de validade'))
    ano_validade = models.PositiveSmallIntegerField(_('ano de validade'))
    
    # Status
    is_principal = models.BooleanField(_('cartão principal'), default=False)
    is_ativo = models.BooleanField(_('ativo'), default=True)
    
    # Metadata
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    data_atualizacao = models.DateTimeField(_('data de atualização'), auto_now=True)
    
    class Meta:
        verbose_name = _('cartão de crédito')
        verbose_name_plural = _('cartões de crédito')
        ordering = ['-is_principal', '-data_criacao']
    
    def __str__(self):
        return f"{self.bandeira} ****{self.ultimos_digitos}"
    
    def save(self, *args, **kwargs):
        # Se este cartão for marcado como principal, desmarcar os outros
        if self.is_principal:
            CartaoCredito.objects.filter(
                usuario=self.usuario,
                is_principal=True
            ).exclude(pk=self.pk).update(is_principal=False)
        super().save(*args, **kwargs)


class Reembolso(models.Model):
    """Refund model."""
    
    class StatusReembolso(models.TextChoices):
        SOLICITADO = 'SOLICITADO', _('Solicitado')
        EM_ANALISE = 'EM_ANALISE', _('Em Análise')
        APROVADO = 'APROVADO', _('Aprovado')
        PROCESSANDO = 'PROCESSANDO', _('Processando')
        CONCLUIDO = 'CONCLUIDO', _('Concluído')
        RECUSADO = 'RECUSADO', _('Recusado')
    
    pagamento = models.ForeignKey(
        Pagamento,
        on_delete=models.CASCADE,
        related_name='reembolsos',
        verbose_name=_('pagamento')
    )
    
    # Valores
    valor_solicitado = models.DecimalField(_('valor solicitado'), max_digits=10, decimal_places=2)
    valor_aprovado = models.DecimalField(_('valor aprovado'), max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Status
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=StatusReembolso.choices,
        default=StatusReembolso.SOLICITADO
    )
    
    # Motivo
    motivo = models.TextField(_('motivo'))
    resposta = models.TextField(_('resposta'), blank=True)
    
    # Gateway
    gateway_reembolso_id = models.CharField(_('ID reembolso gateway'), max_length=200, blank=True)
    
    # Timestamps
    data_solicitacao = models.DateTimeField(_('data de solicitação'), auto_now_add=True)
    data_analise = models.DateTimeField(_('data de análise'), null=True, blank=True)
    data_aprovacao = models.DateTimeField(_('data de aprovação'), null=True, blank=True)
    data_conclusao = models.DateTimeField(_('data de conclusão'), null=True, blank=True)
    data_recusa = models.DateTimeField(_('data de recusa'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('reembolso')
        verbose_name_plural = _('reembolsos')
        ordering = ['-data_solicitacao']
    
    def __str__(self):
        return f"Reembolso {self.pagamento.numero_transacao} - {self.status}"


class HistoricoPagamento(models.Model):
    """Payment history model."""
    
    pagamento = models.ForeignKey(
        Pagamento,
        on_delete=models.CASCADE,
        related_name='historico',
        verbose_name=_('pagamento')
    )
    status_anterior = models.CharField(_('status anterior'), max_length=20, blank=True)
    status_novo = models.CharField(_('status novo'), max_length=20)
    observacao = models.TextField(_('observação'), blank=True)
    data_mudanca = models.DateTimeField(_('data da mudança'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('histórico de pagamento')
        verbose_name_plural = _('históricos de pagamentos')
        ordering = ['-data_mudanca']
    
    def __str__(self):
        return f"{self.pagamento.numero_transacao}: {self.status_anterior} → {self.status_novo}"
