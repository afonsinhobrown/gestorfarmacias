from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
from farmacias.models import Farmacia


class CategoriaProduto(models.Model):
    """Product category model."""
    
    nome = models.CharField(_('nome'), max_length=100, unique=True)
    descricao = models.TextField(_('descrição'), blank=True)
    icone = models.CharField(_('ícone'), max_length=50, blank=True, help_text=_('Nome do ícone (ex: pill, syringe)'))
    is_ativa = models.BooleanField(_('ativa'), default=True)
    ordem = models.PositiveIntegerField(_('ordem'), default=0)
    
    class Meta:
        verbose_name = _('categoria de produto')
        verbose_name_plural = _('categorias de produtos')
        ordering = ['ordem', 'nome']
    
    def __str__(self):
        return self.nome


class Produto(models.Model):
    """Product/Medicine model."""
    
    class TipoProduto(models.TextChoices):
        MEDICAMENTO = 'MEDICAMENTO', _('Medicamento')
        SUPLEMENTO = 'SUPLEMENTO', _('Suplemento')
        COSMÉTICO = 'COSMETICO', _('Cosmético')
        HIGIENE = 'HIGIENE', _('Higiene')
        EQUIPAMENTO = 'EQUIPAMENTO', _('Equipamento')
        OUTRO = 'OUTRO', _('Outro')
    
    # Informações básicas
    nome = models.CharField(_('nome'), max_length=200)
    nome_generico = models.CharField(_('nome genérico'), max_length=200, blank=True)
    codigo_barras = models.CharField(_('código de barras'), max_length=50, unique=True, blank=True, null=True)
    codigo_interno = models.CharField(_('código interno'), max_length=50, blank=True)
    
    # Categoria e tipo
    categoria = models.ForeignKey(
        CategoriaProduto,
        on_delete=models.SET_NULL,
        null=True,
        related_name='produtos',
        verbose_name=_('categoria')
    )
    tipo = models.CharField(
        _('tipo'),
        max_length=20,
        choices=TipoProduto.choices,
        default=TipoProduto.MEDICAMENTO
    )
    
    # Descrição e informações
    descricao = models.TextField(_('descrição'), blank=True)
    composicao = models.TextField(_('composição'), blank=True)
    indicacao = models.TextField(_('indicação'), blank=True)
    contraindicacao = models.TextField(_('contraindicação'), blank=True)
    posologia = models.TextField(_('posologia'), blank=True)
    
    # Especificações
    fabricante = models.CharField(_('fabricante'), max_length=200, blank=True)
    pais_origem = models.CharField(_('país de origem'), max_length=100, blank=True)
    
    # Regulamentação
    requer_receita = models.BooleanField(_('requer receita'), default=False)
    controlado = models.BooleanField(_('controlado'), default=False)
    registro_ministerio = models.CharField(_('registro ministério'), max_length=100, blank=True)
    
    # Apresentação
    forma_farmaceutica = models.CharField(
        _('forma farmacêutica'),
        max_length=100,
        blank=True,
        help_text=_('Ex: comprimido, cápsula, xarope, pomada')
    )
    concentracao = models.CharField(_('concentração'), max_length=100, blank=True)
    quantidade_embalagem = models.CharField(_('quantidade por embalagem'), max_length=100, blank=True)
    
    # Imagens
    imagem_principal = models.ImageField(_('imagem principal'), upload_to='produtos/', blank=True, null=True)
    
    # Status
    is_ativo = models.BooleanField(_('ativo'), default=True)
    
    # Metadata
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    data_atualizacao = models.DateTimeField(_('data de atualização'), auto_now=True)
    
    class Meta:
        verbose_name = _('produto')
        verbose_name_plural = _('produtos')
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} - {self.concentracao}" if self.concentracao else self.nome


class EstoqueProduto(models.Model):
    """Product stock model for each pharmacy."""
    
    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name='estoques',
        verbose_name=_('farmácia')
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='estoques',
        verbose_name=_('produto')
    )
    
    # Estoque
    quantidade = models.PositiveIntegerField(_('quantidade'), default=0)
    quantidade_minima = models.PositiveIntegerField(_('quantidade mínima'), default=10)
    lote = models.CharField(_('lote'), max_length=50, blank=True)
    data_fabricacao = models.DateField(_('data de fabricação'), null=True, blank=True)
    data_validade = models.DateField(_('data de validade'), null=True, blank=True)
    
    # Preços
    preco_custo = models.DecimalField(_('preço de custo'), max_digits=10, decimal_places=2)
    preco_venda = models.DecimalField(_('preço de venda'), max_digits=10, decimal_places=2)
    preco_promocional = models.DecimalField(
        _('preço promocional'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    em_promocao = models.BooleanField(_('em promoção'), default=False)
    
    # Localização no estoque
    localizacao_estoque = models.CharField(
        _('localização no estoque'),
        max_length=100,
        blank=True,
        help_text=_('Ex: Prateleira A, Setor 3')
    )
    
    # Status
    is_disponivel = models.BooleanField(_('disponível'), default=True)
    
    # Metadata
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    data_atualizacao = models.DateTimeField(_('data de atualização'), auto_now=True)
    
    class Meta:
        verbose_name = _('estoque de produto')
        verbose_name_plural = _('estoques de produtos')
        ordering = ['-data_criacao']
        unique_together = ['farmacia', 'produto', 'lote']
    
    def __str__(self):
        return f"{self.produto.nome} - {self.farmacia.nome} (Qtd: {self.quantidade})"
    
    @property
    def estoque_baixo(self):
        """Verifica se o estoque está abaixo do mínimo."""
        return self.quantidade <= self.quantidade_minima

    @property
    def preco_final(self):
        """Retorna o preço final (promocional se disponível, senão o preço normal)."""
        if self.em_promocao and self.preco_promocional:
            return self.preco_promocional
        return self.preco_venda

    def save(self, *args, **kwargs):
        from farmacias.models import Notificacao
        from django.utils import timezone
        import datetime
        import uuid

        # Gerar lote automático se vazio
        if not self.lote:
            hoje_str = timezone.now().strftime('%Y%m%d')
            unique_id = str(uuid.uuid4())[:4].upper()
            self.lote = f"AUTO-{hoje_str}-{unique_id}"

        is_new = self.pk is None
        old_qty = 0
        if not is_new:
            try:
                old_qty = EstoqueProduto.objects.get(pk=self.pk).quantidade
            except EstoqueProduto.DoesNotExist:
                old_qty = 0
            
        super().save(*args, **kwargs)

        # 1. Notificação de Ruptura ou Estoque Baixo
        if self.quantidade == 0:
            Notificacao.objects.get_or_create(
                farmacia=self.farmacia,
                tipo='ESTOQUE',
                titulo=f"RUPTURA: {self.produto.nome}",
                defaults={
                    'mensagem': f"O produto {self.produto.nome} (Lote: {self.lote}) esgotou completamente no estoque.",
                    'lida': False
                }
            )
        elif self.estoque_baixo and (is_new or old_qty > self.quantidade_minima):
            Notificacao.objects.get_or_create(
                farmacia=self.farmacia,
                tipo='ESTOQUE',
                titulo=f"Estoque Baixo: {self.produto.nome}",
                defaults={
                    'mensagem': f"O produto {self.produto.nome} (Lote: {self.lote}) atingiu o nível crítico ({self.quantidade} unidades).",
                    'lida': False
                }
            )

        # 2. Notificação de Validade (Verificação imediata ao salvar)
        if self.data_validade:
            hoje = timezone.now().date()
            dias_para_vencer = (self.data_validade - hoje).days
            
            if dias_para_vencer < 0:
                Notificacao.objects.get_or_create(
                    farmacia=self.farmacia,
                    tipo='EXPIRADO',
                    titulo=f"PRODUTO EXPIRADO: {self.produto.nome}",
                    defaults={
                        'mensagem': f"O lote {self.lote} de {self.produto.nome} expirou em {self.data_validade}.",
                        'lida': False
                    }
                )
            elif dias_para_vencer <= 30:
                Notificacao.objects.get_or_create(
                    farmacia=self.farmacia,
                    tipo='VALIDADE',
                    titulo=f"Validade Próxima: {self.produto.nome}",
                    defaults={
                        'mensagem': f"O lote {self.lote} de {self.produto.nome} vence em {dias_para_vencer} dias ({self.data_validade}).",
                        'lida': False
                    }
                )


class MovimentacaoEstoque(models.Model):
    """Stock movement tracking model."""
    
    class TipoMovimentacao(models.TextChoices):
        ENTRADA = 'ENTRADA', _('Entrada')
        SAIDA = 'SAIDA', _('Saída')
        AJUSTE = 'AJUSTE', _('Ajuste')
        DEVOLUCAO = 'DEVOLUCAO', _('Devolução')
        PERDA = 'PERDA', _('Perda')
    
    estoque = models.ForeignKey(
        EstoqueProduto,
        on_delete=models.CASCADE,
        related_name='movimentacoes',
        verbose_name=_('estoque')
    )
    tipo = models.CharField(
        _('tipo'),
        max_length=20,
        choices=TipoMovimentacao.choices
    )
    quantidade = models.IntegerField(_('quantidade'))
    quantidade_anterior = models.PositiveIntegerField(_('quantidade anterior'))
    quantidade_nova = models.PositiveIntegerField(_('quantidade nova'))
    
    # Rastreabilidade Financeira (Snapshot)
    custo_unitario = models.DecimalField(_('custo unitário'), max_digits=10, decimal_places=2, null=True, blank=True)
    preco_venda_unitario = models.DecimalField(_('preço venda unitário'), max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Auditoria
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='movimentacoes_estoque',
        verbose_name=_('usuário responsável')
    )
    referencia_externa = models.CharField(_('referência externa'), max_length=100, blank=True, help_text=_('Ex: Pedido #123, Nota Fiscal #456'))
    
    motivo = models.TextField(_('motivo'), blank=True)
    observacoes = models.TextField(_('observações'), blank=True)
    data_movimentacao = models.DateTimeField(_('data de movimentação'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('movimentação de estoque')
        verbose_name_plural = _('movimentações de estoque')
        ordering = ['-data_movimentacao']
    

class EntradaEstoque(models.Model):
    """Registro de Entrada de Nota Fiscal / Compra."""
    
    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name='entradas_estoque',
        verbose_name=_('farmácia')
    )
    fornecedor = models.ForeignKey(
        'fornecedores.Fornecedor',
        on_delete=models.PROTECT,
        related_name='entradas',
        verbose_name=_('fornecedor')
    )
    
    numero_nota = models.CharField(_('número da nota/fatura'), max_length=100)
    data_emissao = models.DateField(_('data de emissão'), null=True, blank=True)
    data_entrada = models.DateField(_('data de entrada'), default=timezone.now)
    
    valor_total = models.DecimalField(_('valor total'), max_digits=12, decimal_places=2, default=0)
    arquivo_nota = models.FileField(_('arquivo nota fiscal'), upload_to='notas_fiscais/', null=True, blank=True)
    observacoes = models.TextField(_('observações'), blank=True)
    
    # Controle
    processada = models.BooleanField(_('estoque processado'), default=False)
    financeiro_gerado = models.BooleanField(_('financeiro gerado'), default=False)
    
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='entradas_criadas'
    )
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('entrada de estoque')
        verbose_name_plural = _('entradas de estoque')
        ordering = ['-data_entrada']

    def __str__(self):
        return f"Nota {self.numero_nota} - {self.fornecedor}"


class ItemEntrada(models.Model):
    """Item individual da nota de entrada."""
    
    entrada = models.ForeignKey(
        EntradaEstoque,
        on_delete=models.CASCADE,
        related_name='itens'
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.PROTECT,
        verbose_name=_('produto')
    )
    
    quantidade = models.PositiveIntegerField(_('quantidade'))
    preco_custo_unitario = models.DecimalField(_('custo unitário'), max_digits=10, decimal_places=2)
    
    # Lote e Validade
    lote = models.CharField(_('lote'), max_length=50)
    data_validade = models.DateField(_('data de validade'), null=True, blank=True)
    
    def __str__(self):
        return f"{self.produto.nome} (qtd: {self.quantidade})"
    
    @property
    def subtotal(self):
        return self.quantidade * self.preco_custo_unitario
