from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from pedidos.models import Pedido

class MensagemPedido(models.Model):
    """Chat vinculado a um pedido específico (Cliente <-> Farmácia <-> Motoboy)."""
    
    pedido = models.ForeignKey(
        Pedido, 
        on_delete=models.CASCADE, 
        related_name='mensagens',
        verbose_name=_('pedido')
    )
    remetente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mensagens_enviadas'
    )
    # Texto limitado (ex: 280 caracteres como Twitter/SMS curto)
    texto = models.CharField(_('mensagem'), max_length=280)
    
    data_envio = models.DateTimeField(auto_now_add=True)
    lida = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['data_envio']
        verbose_name = _('mensagem do pedido')
        verbose_name_plural = _('mensagens dos pedidos')

    def __str__(self):
        return f"{self.remetente}: {self.texto[:30]}..."


class Ticket(models.Model):
    """Sistema de suporte para problemas maiores (não resolvidos no chat)."""
    
    class StatusTicket(models.TextChoices):
        ABERTO = 'ABERTO', _('Aberto')
        EM_ANALISE = 'EM_ANALISE', _('Em Análise')
        RESPONDIDO = 'RESPONDIDO', _('Respondido')
        FECHADO = 'FECHADO', _('Fechado')

    class Prioridade(models.TextChoices):
        BAIXA = 'BAIXA', _('Baixa')
        MEDIA = 'MEDIA', _('Média')
        ALTA = 'ALTA', _('Alta')
        URGENTE = 'URGENTE', _('Urgente')

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name=_('usuário que abriu')
    )
    assunto = models.CharField(_('assunto'), max_length=100)
    descricao = models.TextField(_('descrição do problema'))
    
    status = models.CharField(
        max_length=20, 
        choices=StatusTicket.choices, 
        default=StatusTicket.ABERTO
    )
    prioridade = models.CharField(
        max_length=20, 
        choices=Prioridade.choices, 
        default=Prioridade.MEDIA
    )
    
    # Opcional: Vincular a um pedido específico se o problema for uma compra
    pedido = models.ForeignKey(
        Pedido, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='tickets'
    )
    
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-data_criacao']
        verbose_name = _('ticket de suporte')
        verbose_name_plural = _('tickets de suporte')

    def __str__(self):
        return f"#{self.id} - {self.assunto}"


class RespostaTicket(models.Model):
    """Respostas/Interações dentro de um Ticket (Thread)."""
    ticket = models.ForeignKey(
        Ticket, 
        on_delete=models.CASCADE, 
        related_name='respostas'
    )
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    texto = models.TextField(_('resposta'))
    data_envio = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['data_envio']
