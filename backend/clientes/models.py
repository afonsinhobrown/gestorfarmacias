from django.db import models
from django.utils.translation import gettext_lazy as _
from farmacias.models import Farmacia


class Cliente(models.Model):
    """Modelo para clientes da farmácia (não são usuários do sistema)."""
    
    class TipoCliente(models.TextChoices):
        COMUM = 'COMUM', _('Comum')  # Cliente de balcão
        CADASTRADO = 'CADASTRADO', _('Cadastrado')  # Cadastrado pela farmácia
        ONLINE = 'ONLINE', _('Online')  # Registrado na plataforma (tem User)
    
    # Relacionamentos
    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name='clientes',
        verbose_name=_('farmácia')
    )
    usuario = models.OneToOneField(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cliente_perfil',
        verbose_name=_('usuário'),
        help_text=_('Vinculado apenas se for cliente online')
    )
    
    # Dados básicos
    nome_completo = models.CharField(_('nome completo'), max_length=200)
    telefone = models.CharField(_('telefone'), max_length=20)
    email = models.EmailField(_('email'), blank=True, null=True)
    nuit = models.CharField(_('NUIT'), max_length=20, blank=True, null=True)
    
    # Endereço
    endereco = models.CharField(_('endereço'), max_length=300, blank=True)
    bairro = models.CharField(_('bairro'), max_length=100, blank=True)
    cidade = models.CharField(_('cidade'), max_length=100, blank=True, default='Maputo')
    
    # Tipo
    tipo = models.CharField(
        _('tipo de cliente'),
        max_length=20,
        choices=TipoCliente.choices,
        default=TipoCliente.COMUM
    )
    
    # Observações
    observacoes = models.TextField(_('observações'), blank=True)
    
    # Gestão de Crédito (DERRUBANDO PRIMAVERA)
    limite_credito = models.DecimalField(_('limite de crédito'), max_digits=12, decimal_places=2, default=0.00)
    saldo_atual = models.DecimalField(_('saldo atual (Dívida)'), max_digits=12, decimal_places=2, default=0.00)
    is_bloqueado = models.BooleanField(_('bloqueado para crédito'), default=False)
    
    # Metadata
    data_cadastro = models.DateTimeField(_('data de cadastro'), auto_now_add=True)
    data_atualizacao = models.DateTimeField(_('data de atualização'), auto_now=True)
    is_ativo = models.BooleanField(_('ativo'), default=True)
    
    class Meta:
        verbose_name = _('cliente')
        verbose_name_plural = _('clientes')
        ordering = ['-data_cadastro']
        unique_together = [['farmacia', 'telefone']]  # Telefone único por farmácia
    
    def __str__(self):
        return f"{self.nome_completo} - {self.telefone}"

class MovimentoContaCorrente(models.Model):
    """Registo de débitos e créditos na conta corrente do cliente."""
    
    class TipoMovimento(models.TextChoices):
        DEBITO = 'DEBITO', _('Débito (Venda a Prazo)')
        CREDITO = 'CREDITO', _('Crédito (Pagamento/Recebimento)')
        AJUSTE = 'AJUSTE', _('Ajuste de Saldo')

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='movimentos_cc')
    tipo = models.CharField(max_length=20, choices=TipoMovimento.choices)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    data_movimento = models.DateTimeField(auto_now_add=True)
    
    # Vínculo opcional com Pedido
    pedido = models.ForeignKey('pedidos.Pedido', on_delete=models.SET_NULL, null=True, blank=True)
    
    descricao = models.CharField(max_length=255)
    realizado_por = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    # DERRUBANDO PRIMAVERA: Lógica de Idade do Saldo (Data de Vencimento)
    data_vencimento = models.DateField(null=True, blank=True)
    is_liquidado = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('movimento de conta corrente')
        verbose_name_plural = _('movimentos de conta corrente')
        ordering = ['-data_movimento']
