from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from farmacias.models import Farmacia
from produtos.models import Produto, EstoqueProduto
import uuid


class Pedido(models.Model):
    """Order model."""
    
    class StatusPedido(models.TextChoices):
        PENDENTE = 'PENDENTE', _('Pendente')
        CONFIRMADO = 'CONFIRMADO', _('Confirmado')
        PREPARANDO = 'PREPARANDO', _('Preparando')
        PRONTO = 'PRONTO', _('Pronto para Entrega')
        EM_TRANSITO = 'EM_TRANSITO', _('Em Trânsito')
        ENTREGUE = 'ENTREGUE', _('Entregue')
        CANCELADO = 'CANCELADO', _('Cancelado')
    
    class FormaPagamento(models.TextChoices):
        DINHEIRO = 'DINHEIRO', _('Dinheiro (Cash)')
        POS = 'POS', _('POS / Cartão na Entrega')
        MPESA = 'MPESA', _('M-Pesa')
        EMOLA = 'EMOLA', _('e-Mola')
        VISA_ONLINE = 'VISA_ONLINE', _('Visa/Mastercard Online')
        TRANSFERENCIA = 'TRANSFERENCIA', _('Transferência Bancária')
        CREDITO = 'CREDITO', _('Crédito / Conta Corrente')

    numero_pedido = models.CharField(_('número do pedido'), max_length=20, unique=True, editable=False)
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pedidos',
        verbose_name=_('cliente'),
        null=True, blank=True
    )
    # DERRUBANDO PRIMAVERA: Vínculo com perfil de cliente para conta corrente
    cliente_perfil = models.ForeignKey(
        'clientes.Cliente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pedidos_perfil'
    )
    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name='pedidos',
        verbose_name=_('farmácia')
    )
    entregador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='entregas_realizadas',
        verbose_name=_('entregador')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=StatusPedido.choices,
        default=StatusPedido.PENDENTE
    )
    
    forma_pagamento = models.CharField(
        _('forma de pagamento'),
        max_length=20,
        choices=FormaPagamento.choices
    )
    pago = models.BooleanField(_('pago'), default=False)
    
    # Valores
    subtotal = models.DecimalField(_('subtotal'), max_digits=12, decimal_places=2, default=0)
    taxa_entrega = models.DecimalField(_('taxa de entrega'), max_digits=10, decimal_places=2, default=0)
    desconto = models.DecimalField(_('desconto'), max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(_('total'), max_digits=12, decimal_places=2, default=0)
    
    # Pagamento e Troco
    valor_pago = models.DecimalField(_('valor pago'), max_digits=12, decimal_places=2, default=0)
    troco = models.DecimalField(_('troco'), max_digits=12, decimal_places=2, default=0)
    
    # Responsável pela venda (POS)
    vendedor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendas_realizadas',
        verbose_name=_('vendedor')
    )
    
    # Sessão de Caixa (Logica Primavera)
    sessao_caixa = models.ForeignKey(
        'caixa.SessaoCaixa',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendas',
        verbose_name=_('sessão de caixa')
    )
    
    # Entrega
    endereco_entrega = models.CharField(_('endereço de entrega'), max_length=255, blank=True)
    bairro = models.CharField(_('bairro'), max_length=100, blank=True)
    cidade = models.CharField(_('cidade'), max_length=100, default='Maputo')
    referencia = models.CharField(_('ponto de referência'), max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    telefone_contato = models.CharField(_('telefone de contato'), max_length=20, blank=True)
    observacoes = models.TextField(_('observações'), blank=True)
    observacoes_farmacia = models.TextField(_('observações da farmácia'), blank=True)
    
    # Receita médica
    receita_medica = models.ImageField(
        _('receita médica'),
        upload_to='receitas/%Y/%m/',
        null=True,
        blank=True,
        help_text=_('Upload da receita médica (foto ou scan)')
    )

    # Logística de Segurança (QR Codes)
    # 1. Para o Motoboy pegar na Farmácia
    qrcode_coleta = models.ImageField(_('QR Coleta'), upload_to='pedidos/qrcodes/coleta/', blank=True, null=True)
    codigo_coleta = models.CharField(_('código de coleta'), max_length=6, blank=True)
    coletado_em = models.DateTimeField(null=True, blank=True)

    # 2. Para o Cliente confirmar recebimento do Motoboy
    qrcode_entrega = models.ImageField(_('QR Entrega'), upload_to='pedidos/qrcodes/entrega/', blank=True, null=True)
    codigo_entrega = models.CharField(_('código de entrega'), max_length=6, blank=True)
    validado = models.BooleanField(_('entrega validada'), default=False)
    data_validacao = models.DateTimeField(_('data da validação'), null=True, blank=True)

    # 3. QR Code da Fatura/Recibo (Para o Cliente Final)
    qrcode_fatura = models.ImageField(_('QR Fatura'), upload_to='pedidos/qrcodes/fatura/', blank=True, null=True)
    
    # Timestamps
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    data_confirmacao = models.DateTimeField(_('data de confirmação'), null=True, blank=True)
    data_entrega_prevista = models.DateTimeField(_('data de entrega prevista'), null=True, blank=True)
    data_entrega = models.DateTimeField(_('data de entrega'), null=True, blank=True)
    data_cancelamento = models.DateTimeField(_('data de cancelamento'), null=True, blank=True)
    motivo_cancelamento = models.TextField(_('motivo de cancelamento'), blank=True)
    
    class Meta:
        verbose_name = _('pedido')
        verbose_name_plural = _('pedidos')
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Pedido {self.numero_pedido} - {self.cliente.get_full_name()}"
    
    def save(self, *args, **kwargs):
        if not self.numero_pedido:
            # Gerar número do pedido
            from django.utils import timezone
            now = timezone.now()
            self.numero_pedido = f"PED{now.strftime('%Y%m%d%H%M%S')}{self.id or ''}"
        super().save(*args, **kwargs)
    
    def calcular_total(self):
        """Calcula o total do pedido."""
        self.subtotal = sum(item.subtotal for item in self.itens.all())
        self.total = self.subtotal + self.taxa_entrega - self.desconto
        self.save(update_fields=['subtotal', 'total'])

    def anular_venda(self, motivo=None, usuario=None):
        """Cancela o pedido e devolve os itens ao estoque."""
        if self.status == self.StatusPedido.CANCELADO:
            return
            
        from django.db import transaction
        from produtos.models import MovimentacaoEstoque
        
        with transaction.atomic():
            for item in self.itens.all():
                if item.estoque:
                    item.estoque.quantidade += item.quantidade
                    item.estoque.save()
                    
                    # Registrar Kardex
                    MovimentacaoEstoque.objects.create(
                        estoque=item.estoque,
                        tipo='ENTRADA',
                        quantidade=item.quantidade,
                        quantidade_anterior=item.estoque.quantidade - item.quantidade,
                        quantidade_nova=item.estoque.quantidade,
                        usuario=usuario, 
                        motivo=f"Anulação de Venda #{self.numero_pedido}",
                        referencia_externa=self.numero_pedido
                    )
            
            self.status = self.StatusPedido.CANCELADO
            self.pago = False
            if motivo:
                self.motivo_cancelamento = motivo
            self.data_cancelamento = timezone.now()
            self.save()


class ItemPedido(models.Model):
    """Order item model."""
    
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='itens',
        verbose_name=_('pedido')
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='itens_pedido',
        verbose_name=_('produto')
    )
    estoque = models.ForeignKey(
        EstoqueProduto,
        on_delete=models.SET_NULL,
        null=True,
        related_name='itens_pedido',
        verbose_name=_('estoque')
    )
    
    # Quantidade e preços
    quantidade = models.PositiveIntegerField(_('quantidade'), default=1)
    preco_unitario = models.DecimalField(_('preço unitário'), max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(_('subtotal'), max_digits=10, decimal_places=2)
    
    # Venda Avulsa
    is_avulso = models.BooleanField(_('venda avulsa'), default=False)
    
    # Comissões
    valor_comissao = models.DecimalField(_('valor comissão'), max_digits=10, decimal_places=2, default=0)
    
    # Informações adicionais
    observacoes = models.TextField(_('observações'), blank=True)
    
    class Meta:
        verbose_name = _('item do pedido')
        verbose_name_plural = _('itens do pedido')
    
    def __str__(self):
        return f"{self.produto.nome} x {self.quantidade}"
    
    def save(self, *args, **kwargs):
        # Calcular subtotal
        self.subtotal = self.quantidade * self.preco_unitario
        super().save(*args, **kwargs)
        # Atualizar total do pedido
        self.pedido.calcular_total()


class HistoricoPedido(models.Model):
    """Order status history model."""
    
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='historico',
        verbose_name=_('pedido')
    )
    status_anterior = models.CharField(_('status anterior'), max_length=20, blank=True)
    status_novo = models.CharField(_('status novo'), max_length=20)
    observacao = models.TextField(_('observação'), blank=True)
    data_mudanca = models.DateTimeField(_('data da mudança'), auto_now_add=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='mudancas_pedido',
        verbose_name=_('usuário')
    )
    
    class Meta:
        verbose_name = _('histórico do pedido')
        verbose_name_plural = _('históricos dos pedidos')
        ordering = ['-data_mudanca']
    
    def __str__(self):
        return f"{self.pedido.numero_pedido}: {self.status_anterior} → {self.status_novo}"
