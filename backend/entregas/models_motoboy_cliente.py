from django.db import models
from django.conf import settings

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
