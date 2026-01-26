from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class PlanoPrioridade(models.Model):
    """Planos de prioridade/visibilidade para farmácias e motoboys."""
    
    TIPO_CHOICES = [
        ('FARMACIA', 'Farmácia'),
        ('MOTOBOY', 'Motoboy'),
    ]
    
    DURACAO_CHOICES = [
        (7, '7 dias'),
        (15, '15 dias'),
        (30, '30 dias'),
        (90, '90 dias'),
    ]
    
    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    duracao_dias = models.IntegerField(choices=DURACAO_CHOICES)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    descricao = models.TextField()
    ativo = models.BooleanField(default=True)
    ordem_prioridade = models.IntegerField(default=1, help_text="1=Mais alta, 5=Mais baixa")
    
    class Meta:
        verbose_name = 'Plano de Prioridade'
        verbose_name_plural = 'Planos de Prioridade'
        ordering = ['tipo', 'ordem_prioridade']
    
    def __str__(self):
        return f"{self.nome} - {self.get_tipo_display()} - {self.duracao_dias} dias"


class AssinaturaPrioridade(models.Model):
    """Assinatura de prioridade ativa."""
    
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente Aprovação'),
        ('ATIVA', 'Ativa'),
        ('EXPIRADA', 'Expirada'),
        ('CANCELADA', 'Cancelada'),
        ('REJEITADA', 'Rejeitada'),
    ]
    
    plano = models.ForeignKey(PlanoPrioridade, on_delete=models.PROTECT)
    
    # Pode ser farmácia ou motoboy
    farmacia = models.ForeignKey(
        'farmacias.Farmacia',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='assinaturas_prioridade'
    )
    motoboy = models.ForeignKey(
        'entregas.Entregador',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='assinaturas_prioridade'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    
    # Datas
    data_solicitacao = models.DateTimeField(auto_now_add=True)
    data_inicio = models.DateTimeField(null=True, blank=True)
    data_fim = models.DateTimeField(null=True, blank=True)
    data_aprovacao = models.DateTimeField(null=True, blank=True)
    
    # Pagamento
    valor_pago = models.DecimalField(max_digits=10, decimal_places=2)
    comprovativo_pagamento = models.ImageField(
        upload_to='prioridade/comprovantes/',
        null=True,
        blank=True
    )
    
    # Admin
    aprovado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assinaturas_aprovadas'
    )
    observacoes_admin = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Assinatura de Prioridade'
        verbose_name_plural = 'Assinaturas de Prioridade'
        ordering = ['-data_solicitacao']
    
    def __str__(self):
        entidade = self.farmacia or self.motoboy
        return f"{entidade} - {self.plano.nome} - {self.status}"
    
    def aprovar(self, admin_user):
        """Aprova a assinatura e ativa."""
        self.status = 'ATIVA'
        self.aprovado_por = admin_user
        self.data_aprovacao = timezone.now()
        self.data_inicio = timezone.now()
        self.data_fim = self.data_inicio + timedelta(days=self.plano.duracao_dias)
        self.save()
    
    def rejeitar(self, admin_user, motivo=''):
        """Rejeita a assinatura."""
        self.status = 'REJEITADA'
        self.aprovado_por = admin_user
        self.observacoes_admin = motivo
        self.save()
    
    def is_ativa(self):
        """Verifica se a assinatura está ativa."""
        if self.status != 'ATIVA':
            return False
        if not self.data_fim:
            return False
        if timezone.now() > self.data_fim:
            self.status = 'EXPIRADA'
            self.save()
            return False
        return True
    
    def dias_restantes(self):
        """Retorna dias restantes da assinatura."""
        if not self.data_fim:
            return 0
        delta = self.data_fim - timezone.now()
        return max(0, delta.days)


class HistoricoPrioridade(models.Model):
    """Histórico de mudanças nas assinaturas."""
    
    assinatura = models.ForeignKey(
        AssinaturaPrioridade,
        on_delete=models.CASCADE,
        related_name='historico'
    )
    acao = models.CharField(max_length=100)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    data = models.DateTimeField(auto_now_add=True)
    detalhes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Histórico de Prioridade'
        verbose_name_plural = 'Históricos de Prioridade'
        ordering = ['-data']
    
    def __str__(self):
        return f"{self.assinatura} - {self.acao} - {self.data}"
