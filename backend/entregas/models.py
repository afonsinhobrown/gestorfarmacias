from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from pedidos.models import Pedido


class Entregador(models.Model):
    """Delivery person model."""
    
    class StatusEntregador(models.TextChoices):
        DISPONIVEL = 'DISPONIVEL', _('Disponível')
        OCUPADO = 'OCUPADO', _('Ocupado')
        OFFLINE = 'OFFLINE', _('Offline')
        INATIVO = 'INATIVO', _('Inativo')
    
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='entregador',
        verbose_name=_('usuário')
    )
    
    # Informações pessoais
    documento_identidade = models.CharField(_('documento de identidade'), max_length=50, unique=True)
    data_nascimento = models.DateField(_('data de nascimento'))
    foto_documento = models.ImageField(_('foto do documento'), upload_to='entregadores/documentos/', blank=True, null=True)
    foto_perfil = models.ImageField(_('foto de perfil'), upload_to='entregadores/perfis/', blank=True, null=True)
    
    # Veículo
    tipo_veiculo = models.CharField(
        _('tipo de veículo'),
        max_length=50,
        choices=[
            ('MOTO', _('Moto')),
            ('BICICLETA', _('Bicicleta')),
            ('CARRO', _('Carro')),
            ('A_PE', _('A pé')),
        ],
        default='MOTO'
    )
    placa_veiculo = models.CharField(_('placa do veículo'), max_length=20, blank=True)
    modelo_veiculo = models.CharField(_('modelo do veículo'), max_length=100, blank=True)
    cor_veiculo = models.CharField(_('cor do veículo'), max_length=50, blank=True)
    estado_veiculo = models.CharField(_('estado do veículo'), max_length=100, blank=True, help_text='Ex: Bom, Regular, Novo')
    foto_veiculo = models.ImageField(_('foto do veículo'), upload_to='entregadores/veiculos/', blank=True, null=True)
    
    # Documentação do veículo
    carta_conducao = models.CharField(_('carta de condução'), max_length=50, blank=True)
    validade_carta = models.DateField(_('validade da carta'), null=True, blank=True)
    documento_veiculo = models.ImageField(_('documento do veículo'), upload_to='entregadores/docs_veiculo/', blank=True, null=True, help_text='TVDE, Seguro, etc')
    
    # Status de aprovação
    STATUS_APROVACAO = [
        ('PENDENTE', _('Pendente')),
        ('APROVADO', _('Aprovado')),
        ('REJEITADO', _('Rejeitado')),
    ]
    status_aprovacao = models.CharField(
        _('status de aprovação'),
        max_length=20,
        choices=STATUS_APROVACAO,
        default='PENDENTE'
    )
    motivo_rejeicao = models.TextField(_('motivo da rejeição'), blank=True)
    data_aprovacao = models.DateTimeField(_('data de aprovação'), null=True, blank=True)
    aprovado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='entregadores_aprovados',
        verbose_name=_('aprovado por')
    )
    
    # Status e disponibilidade
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=StatusEntregador.choices,
        default=StatusEntregador.OFFLINE
    )
    is_verificado = models.BooleanField(_('verificado'), default=False)
    is_ativo = models.BooleanField(_('ativo'), default=True)
    
    # Localização atual
    latitude_atual = models.DecimalField(
        _('latitude atual'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    longitude_atual = models.DecimalField(
        _('longitude atual'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    ultima_localizacao = models.DateTimeField(_('última localização'), null=True, blank=True)
    
    # Estatísticas
    total_entregas = models.PositiveIntegerField(_('total de entregas'), default=0)
    nota_media = models.DecimalField(_('nota média'), max_digits=3, decimal_places=2, default=0.0)
    total_avaliacoes = models.PositiveIntegerField(_('total de avaliações'), default=0)
    
    # Metadata
    data_cadastro = models.DateTimeField(_('data de cadastro'), auto_now_add=True)
    data_atualizacao = models.DateTimeField(_('data de atualização'), auto_now=True)
    
    class Meta:
        verbose_name = _('entregador')
        verbose_name_plural = _('entregadores')
        ordering = ['-data_cadastro']
    
    def __str__(self):
        return f"{self.usuario.get_full_name()} - {self.tipo_veiculo}"


class Entrega(models.Model):
    """Delivery model."""
    
    class StatusEntrega(models.TextChoices):
        AGUARDANDO = 'AGUARDANDO', _('Aguardando Entregador')
        ATRIBUIDA = 'ATRIBUIDA', _('Atribuída')
        ACEITA = 'ACEITA', _('Aceita')
        COLETADA = 'COLETADA', _('Coletada')
        EM_TRANSITO = 'EM_TRANSITO', _('Em Trânsito')
        ENTREGUE = 'ENTREGUE', _('Entregue')
        CANCELADA = 'CANCELADA', _('Cancelada')
        RECUSADA = 'RECUSADA', _('Recusada')
    
    pedido = models.OneToOneField(
        Pedido,
        on_delete=models.CASCADE,
        related_name='entrega',
        verbose_name=_('pedido')
    )
    entregador = models.ForeignKey(
        Entregador,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='entregas',
        verbose_name=_('entregador')
    )
    
    # Status
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=StatusEntrega.choices,
        default=StatusEntrega.AGUARDANDO
    )
    
    # Distância e tempo
    distancia_km = models.DecimalField(
        _('distância (km)'),
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )
    tempo_estimado_minutos = models.PositiveIntegerField(
        _('tempo estimado (minutos)'),
        null=True,
        blank=True
    )
    
    # Localização de coleta (farmácia)
    latitude_coleta = models.DecimalField(_('latitude coleta'), max_digits=9, decimal_places=6)
    longitude_coleta = models.DecimalField(_('longitude coleta'), max_digits=9, decimal_places=6)
    
    # Localização de entrega
    latitude_entrega = models.DecimalField(_('latitude entrega'), max_digits=9, decimal_places=6)
    longitude_entrega = models.DecimalField(_('longitude entrega'), max_digits=9, decimal_places=6)
    
    # Timestamps
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    data_atribuicao = models.DateTimeField(_('data de atribuição'), null=True, blank=True)
    data_aceitacao = models.DateTimeField(_('data de aceitação'), null=True, blank=True)
    data_coleta = models.DateTimeField(_('data de coleta'), null=True, blank=True)
    data_inicio_transito = models.DateTimeField(_('data início trânsito'), null=True, blank=True)
    data_entrega = models.DateTimeField(_('data de entrega'), null=True, blank=True)
    data_cancelamento = models.DateTimeField(_('data de cancelamento'), null=True, blank=True)
    
    # Observações
    observacoes = models.TextField(_('observações'), blank=True)
    motivo_cancelamento = models.TextField(_('motivo de cancelamento'), blank=True)
    motivo_recusa = models.TextField(_('motivo de recusa'), blank=True)
    
    # Validação
    codigo_validacao_coleta = models.CharField(_('código validação coleta'), max_length=50, blank=True)
    codigo_validacao_entrega = models.CharField(_('código validação entrega'), max_length=50, blank=True)
    validado_coleta = models.BooleanField(_('validado coleta'), default=False)
    validado_entrega = models.BooleanField(_('validado entrega'), default=False)
    
    # Foto comprovante
    foto_comprovante = models.ImageField(
        _('foto comprovante'),
        upload_to='entregas/comprovantes/',
        blank=True,
        null=True
    )
    
    class Meta:
        verbose_name = _('entrega')
        verbose_name_plural = _('entregas')
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Entrega {self.pedido.numero_pedido}"


class RastreamentoEntrega(models.Model):
    """Delivery tracking model for real-time location updates."""
    
    entrega = models.ForeignKey(
        Entrega,
        on_delete=models.CASCADE,
        related_name='rastreamentos',
        verbose_name=_('entrega')
    )
    latitude = models.DecimalField(_('latitude'), max_digits=9, decimal_places=6)
    longitude = models.DecimalField(_('longitude'), max_digits=9, decimal_places=6)
    timestamp = models.DateTimeField(_('timestamp'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('rastreamento de entrega')
        verbose_name_plural = _('rastreamentos de entregas')
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Rastreamento {self.entrega.pedido.numero_pedido} - {self.timestamp}"


class AvaliacaoEntrega(models.Model):
    """Delivery rating model."""
    
    entrega = models.OneToOneField(
        Entrega,
        on_delete=models.CASCADE,
        related_name='avaliacao',
        verbose_name=_('entrega')
    )
    nota = models.PositiveSmallIntegerField(
        _('nota'),
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text=_('Nota de 1 a 5')
    )
    comentario = models.TextField(_('comentário'), blank=True)
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('avaliação de entrega')
        verbose_name_plural = _('avaliações de entregas')
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Avaliação {self.entrega.pedido.numero_pedido} - {self.nota} estrelas"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Atualizar nota média do entregador
        if self.entrega.entregador:
            self.entrega.entregador.atualizar_nota_media()


# Adicionar método à classe Entregador
def atualizar_nota_media(self):
    """Atualiza a nota média e total de avaliações do entregador."""
    avaliacoes = AvaliacaoEntrega.objects.filter(entrega__entregador=self)
    if avaliacoes.exists():
        self.total_avaliacoes = avaliacoes.count()
        self.nota_media = sum(a.nota for a in avaliacoes) / self.total_avaliacoes
        self.save(update_fields=['nota_media', 'total_avaliacoes'])

Entregador.atualizar_nota_media = atualizar_nota_media


class MotoboyCliente(models.Model):
    """Motoboy cadastrado pelo cliente para suas entregas."""
    
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meus_motoboys'
    )
    nome = models.CharField(max_length=100)
    telefone = models.CharField(max_length=20)
    placa_moto = models.CharField(max_length=10, blank=True)
    observacoes = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Motoboy do Cliente'
        verbose_name_plural = 'Motoboys dos Clientes'
        ordering = ['-data_cadastro']
    
    def __str__(self):
        return f"{self.nome} - {self.cliente.email}"
