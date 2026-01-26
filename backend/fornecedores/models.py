from django.db import models
from django.utils.translation import gettext_lazy as _
from farmacias.models import Farmacia

class Fornecedor(models.Model):
    """Cadastro de Fornecedores de Medicamentos/Produtos."""
    
    farmacia = models.ForeignKey(
        Farmacia, 
        on_delete=models.CASCADE, 
        related_name='meus_fornecedores',
        verbose_name=_('farmácia'),
        help_text=_('Farmácia que cadastrou este fornecedor')
    )
    
    # Identificação
    razao_social = models.CharField(_('razão social'), max_length=200)
    nome_fantasia = models.CharField(_('nome fantasia'), max_length=200, blank=True)
    nuit = models.CharField(_('NUIT'), max_length=20, blank=True)
    
    # Contato
    responsavel = models.CharField(_('pessoa de contato'), max_length=100, blank=True)
    telefone_principal = models.CharField(_('telefone'), max_length=20)
    telefone_secundario = models.CharField(_('telefone secundário'), max_length=20, blank=True)
    email = models.EmailField(_('email'), blank=True)
    website = models.URLField(blank=True)
    
    # Endereço
    endereco = models.TextField(_('endereço'), blank=True)
    cidade = models.CharField(_('cidade'), max_length=100, blank=True)
    
    # Dados Comerciais
    prazo_pagamento_dias = models.PositiveIntegerField(
        _('prazo padrão (dias)'), 
        default=30,
        help_text=_('Dias para pagamento após a fatura')
    )
    limite_kredito = models.DecimalField(
        _('limite de crédito'), 
        max_digits=12, 
        decimal_places=2, 
        default=0.00
    )
    
    # Dados Bancários (para pagamentos)
    banco = models.CharField(_('banco'), max_length=100, blank=True)
    conta_bancaria = models.CharField(_('nº da conta'), max_length=50, blank=True)
    iban = models.CharField(_('IBAN'), max_length=50, blank=True)
    
    # Avaliação Interna
    observacoes = models.TextField(_('observações'), blank=True)
    is_ativo = models.BooleanField(_('ativo'), default=True)
    
    data_cadastro = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('fornecedor')
        verbose_name_plural = _('fornecedores')
        ordering = ['nome_fantasia', 'razao_social']
        # Uma farmácia não pode cadastrar o mesmo fornecedor (NUIT) duas vezes?
        # unique_together = ['farmacia', 'nuit'] # Pode dar problema se NUIT for vazio

    def __str__(self):
        return self.nome_fantasia or self.razao_social
