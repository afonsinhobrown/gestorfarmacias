from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from farmacias.models import Farmacia
from fornecedores.models import Fornecedor
from produtos.models import Produto

class OrdemCompra(models.Model):
    """Representa um pedido formal de mercadoria a um fornecedor."""
    
    class StatusOrdem(models.TextChoices):
        RASCUNHO = 'RASCUNHO', _('Rascunho')
        ENVIADA = 'ENVIADA', _('Enviada ao Fornecedor')
        RECEBIDA_PARCIAL = 'RECEBIDA_PARCIAL', _('Recebida Parcialmente')
        CONCLUIDA = 'CONCLUIDA', _('Concluída (Stock Atualizado)')
        CANCELADA = 'CANCELADA', _('Cancelada')

    farmacia = models.ForeignKey(Farmacia, on_delete=models.CASCADE, related_name='ordens_compra')
    fornecedor = models.ForeignKey(Fornecedor, on_delete=models.PROTECT, related_name='ordens_compra')
    
    codigo = models.CharField(_('código da ordem'), max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=StatusOrdem.choices, default=StatusOrdem.RASCUNHO)
    
    data_emissao = models.DateField(_('data de emissão'), auto_now_add=True)
    data_entrega_prevista = models.DateField(_('entrega prevista'), null=True, blank=True)
    
    valor_total = models.DecimalField(_('valor total'), max_digits=12, decimal_places=2, default=0)
    
    # Responsável pelo pedido
    comprador = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='minhas_compras'
    )
    
    observacoes = models.TextField(_('observações'), blank=True)
    
    class Meta:
        verbose_name = _('ordem de compra')
        verbose_name_plural = _('ordens de compra')
        ordering = ['-data_emissao']

    def __str__(self):
        return f"{self.codigo} - {self.fornecedor.nome_fantasia}"

class ItemOrdemCompra(models.Model):
    """Produtos incluídos na Ordem de Compra."""
    
    ordem = models.ForeignKey(OrdemCompra, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    
    quantidade_pedida = models.PositiveIntegerField(_('qtd pedida'))
    quantidade_recebida = models.PositiveIntegerField(_('qtd recebida'), default=0)
    
    preco_unitario_acordado = models.DecimalField(_('preço unitário'), max_digits=12, decimal_places=2)
    desconto = models.DecimalField(_('desconto (%)'), max_digits=5, decimal_places=2, default=0)
    
    # Historico: Superando Primavera (Preço médio de mercado)
    preco_ultima_compra = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def total_item(self):
        return self.quantidade_pedida * self.preco_unitario_acordado * (1 - self.desconto/100)

class FaturaCompra(models.Model):
    """Documento financeiro do fornecedor."""
    
    ordem = models.OneToOneField(OrdemCompra, on_delete=models.CASCADE, related_name='fatura')
    numero_fatura = models.CharField(_('nº da fatura'), max_length=50)
    
    data_fatura = models.DateField(_('data da fatura'))
    data_vencimento = models.DateField(_('vencimento'))
    
    arquivo_fatura = models.FileField(upload_to='compras/faturas/', null=True, blank=True)
    
    is_paga = models.BooleanField(default=False)
    despesa_vinculada = models.ForeignKey('financeiro.Despesa', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = _('fatura de compra')
class RececaoStock(models.Model):
    """Registo de entrada física de material (Guia de Entrada)."""
    
    ordem = models.ForeignKey(OrdemCompra, on_delete=models.CASCADE, related_name='rececoes')
    data_rececao = models.DateTimeField(auto_now_add=True)
    
    recebido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True
    )
    
    documento_guia = models.FileField(upload_to='compras/guias/', null=True, blank=True)
    notas = models.TextField(blank=True)

    class Meta:
        verbose_name = _('receção de stock')
        verbose_name_plural = _('receções de stock')
