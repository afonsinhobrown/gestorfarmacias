from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from produtos.models import EstoqueProduto, MovimentacaoEstoque
from farmacias.models import Notificacao

class Command(BaseCommand):
    help = 'Verifica validade dos produtos, notifica vencimentos próximos e expira vencidos.'

    def handle(self, *args, **options):
        hoje = timezone.now().date()
        aviso_data = hoje + timedelta(days=30)
        
        # 1. Processar Lotes JÁ Vencidos
        vencidos = EstoqueProduto.objects.filter(
            data_validade__lt=hoje, 
            is_disponivel=True
        )
        
        count_vencidos = 0
        for lote in vencidos:
            # Desativa o lote
            lote.is_disponivel = False
            lote.save()
            
            # Registra PERDA no histórico (Abate financeiro)
            MovimentacaoEstoque.objects.create(
                estoque=lote,
                tipo=MovimentacaoEstoque.TipoMovimentacao.PERDA,
                quantidade=lote.quantidade,
                quantidade_anterior=lote.quantidade,
                quantidade_nova=0, # Perda total assumida por segurança
                motivo="VALIDADE EXPIRADA - BAIXA AUTOMÁTICA",
                observacoes=f"Lote {lote.lote} expirou em {lote.data_validade}"
            )
            
            # Notifica a farmácia
            Notificacao.objects.create(
                farmacia=lote.farmacia,
                tipo=Notificacao.TipoNotificacao.EXPIRADO,
                titulo=f"Lote Expirado: {lote.produto.nome}",
                mensagem=f"O lote {lote.lote} venceu em {lote.data_validade} e foi removido do estoque automaticamente."
                f"Quantidade perdida: {lote.quantidade}. Prejuízo estimado: {lote.quantidade * lote.preco_custo} MT."
            )
            count_vencidos += 1
            
        self.stdout.write(self.style.SUCCESS(f'{count_vencidos} lotes expirados processados.'))

        # 2. Notificar Lotes Vencendo em 30 Dias (ou menos)
        proximos = EstoqueProduto.objects.filter(
            data_validade__range=[hoje, aviso_data],
            is_disponivel=True
        )
        
        count_avisos = 0
        for lote in proximos:
            # Verifica se já notificou hoje para não fazer spam (lógica simplificada aqui)
            existe = Notificacao.objects.filter(
                farmacia=lote.farmacia,
                titulo__contains=f"Vence em Breve: {lote.produto.nome}",
                data_criacao__date=hoje
            ).exists()
            
            if not existe:
                dias_restantes = (lote.data_validade - hoje).days
                Notificacao.objects.create(
                    farmacia=lote.farmacia,
                    tipo=Notificacao.TipoNotificacao.VALIDADE,
                    titulo=f"Vence em Breve: {lote.produto.nome}",
                    mensagem=f"O lote {lote.lote} vence em {dias_restantes} dias ({lote.data_validade}). "
                    f"Considere colocar em promoção!"
                )
                count_avisos += 1
                
        self.stdout.write(self.style.SUCCESS(f'{count_avisos} alertas de validade gerados.'))
