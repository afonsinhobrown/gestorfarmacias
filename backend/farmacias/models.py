from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Gibagio(models.Model):
    """Entidade de Gestão Local (Gibagio)."""
    nome = models.CharField(_('nome'), max_length=200)
    codigo = models.CharField(_('código'), max_length=50, unique=True)
    descricao = models.TextField(_('descrição'), blank=True)
    is_ativo = models.BooleanField(_('ativo'), default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome

class Licenca(models.Model):
    """Modelo de Licença/Assinatura para Farmácias."""
    class TipoLicenca(models.TextChoices):
        MENSAL = 'MENSAL', _('Mensal')
        ANUAL = 'ANUAL', _('Anual')
        TRIAL = 'TRIAL', _('Teste (7 dias)')

    farmacia = models.ForeignKey(
        'Farmacia', 
        on_delete=models.CASCADE, 
        related_name='licencas'
    )
    tipo = models.CharField(
        max_length=20, 
        choices=TipoLicenca.choices, 
        default=TipoLicenca.TRIAL
    )
    chave = models.CharField(_('chave da licença'), max_length=100, unique=True, blank=True)
    data_inicio = models.DateField(_('data de início'))
    data_fim = models.DateField(_('data de término'))
    is_ativa = models.BooleanField(_('ativa'), default=True)
    paga = models.BooleanField(_('paga'), default=False)

    def is_expirada(self):
        from django.utils import timezone
        return timezone.now().date() > self.data_fim

    def __str__(self):
        return f"Licença {self.tipo} - {self.farmacia.nome}"

class Farmacia(models.Model):
    """Model representing a pharmacy."""
    
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='farmacia_perfil',
        verbose_name=_('usuário')
    )
    gibagio = models.ForeignKey(
        Gibagio,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='farmacias',
        verbose_name=_('Gibagio / Gestão Local')
    )
    nome = models.CharField(_('nome'), max_length=200)
    nome_fantasia = models.CharField(_('nome fantasia'), max_length=200, blank=True)
    nuit = models.CharField(_('NUIT'), max_length=20, unique=True)
    alvara = models.CharField(_('alvará'), max_length=100, blank=True)
    percentual_iva = models.DecimalField(_('Taxa IVA (%)'), max_digits=5, decimal_places=2, default=16.00)
    
    # ... (rest of contact and address fields)
    telefone_principal = models.CharField(_('telefone principal'), max_length=20)
    telefone_alternativo = models.CharField(_('telefone alternativo'), max_length=20, blank=True)
    email = models.EmailField(_('email'))
    website = models.URLField(_('website'), blank=True)
    
    # Endereço
    endereco = models.TextField(_('endereço'))
    bairro = models.CharField(_('bairro'), max_length=100)
    cidade = models.CharField(_('cidade'), max_length=100)
    provincia = models.CharField(_('província'), max_length=100)
    codigo_postal = models.CharField(_('código postal'), max_length=20, blank=True)
    
    # Geolocalização
    latitude = models.DecimalField(
        _('latitude'),
        max_digits=9,
        decimal_places=6,
        help_text=_('Latitude para localização no mapa')
    )
    longitude = models.DecimalField(
        _('longitude'),
        max_digits=9,
        decimal_places=6,
        help_text=_('Longitude para localização no mapa')
    )
    
    # Horário de funcionamento
    horario_abertura = models.TimeField(_('horário de abertura'), null=True, blank=True)
    horario_fechamento = models.TimeField(_('horário de fechamento'), null=True, blank=True)
    funciona_24h = models.BooleanField(_('funciona 24h'), default=False)
    
    # Informações adicionais e Bancárias
    descricao = models.TextField(_('descrição'), blank=True)
    logo = models.ImageField(_('logo'), upload_to='farmacias/logos/', blank=True, null=True)
    foto_fachada = models.ImageField(_('foto da fachada'), upload_to='farmacias/fotos/', blank=True, null=True)
    
    # Dados Bancários / Pagamento
    banco_nome = models.CharField(_('nome do banco'), max_length=100, blank=True)
    banco_conta = models.CharField(_('número da conta'), max_length=50, blank=True)
    banco_nib = models.CharField(_('NIB'), max_length=50, blank=True)
    mpesa_numero = models.CharField(_('número M-Pesa'), max_length=20, blank=True)
    emola_numero = models.CharField(_('número e-Mola'), max_length=20, blank=True)
    
    # Status e avaliação
    is_ativa = models.BooleanField(_('ativa'), default=True)
    is_verificada = models.BooleanField(_('verificada'), default=False)
    aceita_entregas = models.BooleanField(_('aceita entregas'), default=True)
    raio_entrega_km = models.DecimalField(
        _('raio de entrega (km)'),
        max_digits=5,
        decimal_places=2,
        default=5.0,
        help_text=_('Raio máximo de entrega em quilômetros')
    )
    taxa_entrega = models.DecimalField(
        _('taxa de entrega'),
        max_digits=10,
        decimal_places=2,
        default=0.0
    )
    
    # Avaliações
    nota_media = models.DecimalField(
        _('nota média'),
        max_digits=3,
        decimal_places=2,
        default=0.0
    )
    total_avaliacoes = models.PositiveIntegerField(_('total de avaliações'), default=0)
    
    # Metadata
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    data_atualizacao = models.DateTimeField(_('data de atualização'), auto_now=True)
    
    class Meta:
        verbose_name = _('farmácia')
        verbose_name_plural = _('farmácias')
        ordering = ['-data_criacao']
    
    def __str__(self):
        return self.nome
    
    def atualizar_nota_media(self):
        """Atualiza a nota média e total de avaliações da farmácia."""
        avaliacoes = self.avaliacoes.all()
        if avaliacoes.exists():
            self.total_avaliacoes = avaliacoes.count()
            self.nota_media = sum(a.nota for a in avaliacoes) / self.total_avaliacoes
            self.save(update_fields=['nota_media', 'total_avaliacoes'])


class AvaliacaoFarmacia(models.Model):
    """Model for pharmacy ratings and reviews."""
    
    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name='avaliacoes',
        verbose_name=_('farmácia')
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='avaliacoes_farmacias',
        verbose_name=_('usuário')
    )
    nota = models.PositiveSmallIntegerField(
        _('nota'),
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text=_('Nota de 1 a 5')
    )
    comentario = models.TextField(_('comentário'), blank=True)
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('avaliação de farmácia')
        verbose_name_plural = _('avaliações de farmácias')
        ordering = ['-data_criacao']
        unique_together = ['farmacia', 'usuario']
    
    def __str__(self):
        return f"{self.farmacia.nome} - {self.nota} estrelas"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.farmacia.atualizar_nota_media()


class Notificacao(models.Model):
    """Notificações para a farmácia (ex: validade, estoque baixo)."""
    
    class TipoNotificacao(models.TextChoices):
        VALIDADE = 'VALIDADE', _('Validade Próxima')
        EXPIRADO = 'EXPIRADO', _('Produto Expirado')
        ESTOQUE = 'ESTOQUE', _('Estoque Baixo')
        PEDIDO = 'PEDIDO', _('Novo Pedido')
        SISTEMA = 'SISTEMA', _('Sistema')

    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name='notificacoes',
        verbose_name=_('farmácia')
    )
    tipo = models.CharField(
        _('tipo'),
        max_length=20,
        choices=TipoNotificacao.choices,
        default=TipoNotificacao.SISTEMA
    )
    titulo = models.CharField(_('título'), max_length=200)
    mensagem = models.TextField(_('mensagem'))
    lida = models.BooleanField(_('lida'), default=False)
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('notificação')
        verbose_name_plural = _('notificações')
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"[{self.tipo}] {self.titulo}"
