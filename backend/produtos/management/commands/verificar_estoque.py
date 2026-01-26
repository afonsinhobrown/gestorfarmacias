from django.core.management.base import BaseCommand
from django.utils import timezone
from produtos.models import EstoqueProduto
from farmacias.models import Notificacao
import datetime

class Command(BaseCommand):
    help = 'Verifica Validade e Estoque e gera notificações para as farmácias.'

    def handle(self, *args, **options):
        hoje = timezone.now().date()
        proximos_30_dias = hoje + datetime.timedelta(days=30)
        
        self.stdout.write(f"Iniciando verificação de estoque e validade em {hoje}...")
        
        # 1. Verificar Validade
        estoques = EstoqueProduto.objects.filter(data_validade__isnull=False)
        count_validade = 0
        
        for item in estoques:
            dias_para_vencer = (item.data_validade - hoje).days
            
            if dias_para_vencer < 0:
                # Já expirado
                _, created = Notificacao.objects.get_or_create(
                    farmacia=item.farmacia,
                    tipo='EXPIRADO',
                    titulo=f"PRODUTO EXPIRADO: {item.produto.nome}",
                    defaults={'mensagem': f"O lote {item.lote} de {item.produto.nome} expirou em {item.data_validade}."}
                )
                if created: count_validade += 1
            
            elif dias_para_vencer <= 30:
                # Vencendo em breve
                _, created = Notificacao.objects.get_or_create(
                    farmacia=item.farmacia,
                    tipo='VALIDADE',
                    titulo=f"Validade Próxima: {item.produto.nome}",
                    defaults={'mensagem': f"O lote {item.lote} de {item.produto.nome} vence em {dias_para_vencer} dias ({item.data_validade})."}
                )
                if created: count_validade += 1

        # 2. Verificar Ruptura de Estoque
        rupturas = EstoqueProduto.objects.filter(quantidade=0)
        count_ruptura = 0
        for item in rupturas:
            _, created = Notificacao.objects.get_or_create(
                farmacia=item.farmacia,
                tipo='ESTOQUE',
                titulo=f"RUPTURA: {item.produto.nome}",
                defaults={'mensagem': f"O produto {item.produto.nome} (Lote: {item.lote}) esgotou completamente no estoque."}
            )
            if created: count_ruptura += 1

        # 3. Verificar Estoque Baixo
        baixo_estoque = EstoqueProduto.objects.all()
        count_baixo = 0
        for item in baixo_estoque:
            if 0 < item.quantidade <= item.quantidade_minima:
                _, created = Notificacao.objects.get_or_create(
                    farmacia=item.farmacia,
                    tipo='ESTOQUE',
                    titulo=f"Estoque Baixo: {item.produto.nome}",
                    defaults={'mensagem': f"O produto {item.produto.nome} atingiu o nível crítico ({item.quantidade} unidades)."}
                )
                if created: count_baixo += 1

        self.stdout.write(self.style.SUCCESS(
            f"Verificação concluída: {count_validade} alertas de validade, "
            f"{count_ruptura} rupturas e {count_baixo} estoques baixos notificados."
        ))
