from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Sum, Avg, Count, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
from pedidos.models import Pedido
from produtos.models import EstoqueProduto
from farmacias.models import Notificacao

class DashboardStatsView(APIView):
    """View para estatísticas em tempo real do Dashboard da Farmácia."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'farmacia'):
            return Response({'error': 'Acesso restrito a farmácias'}, status=status.HTTP_403_FORBIDDEN)
        
        farmacia = request.user.farmacia
        hoje = timezone.now().date()
        
        # 1. Vendas Hoje
        pedidos_hoje = Pedido.objects.filter(
            farmacia=farmacia, 
            data_criacao__date=hoje
        )
        vendas_hoje = pedidos_hoje.aggregate(total=Sum('total'))['total'] or 0
        
        # 2. Ticket Médio Hoje
        ticket_medio = pedidos_hoje.aggregate(media=Avg('total'))['media'] or 0
        
        # 3. Pedidos Pendentes
        pendentes = Pedido.objects.filter(
            farmacia=farmacia, 
            status__in=['PENDENTE', 'CONFIRMADO', 'PREPARANDO']
        ).count()
        
        # 4. Estoque Crítico (Baixo ou Ruptura)
        estoques = EstoqueProduto.objects.filter(farmacia=farmacia)
        ruptura = estoques.filter(quantidade=0).count()
        critico = estoques.filter(quantidade__gt=0, quantidade__lte=F('quantidade_minima')).count()
        
        # 5. Entregas Concluídas Hoje
        entregas_concluidas = Pedido.objects.filter(
            farmacia=farmacia, 
            status='ENTREGUE',
            data_entrega__date=hoje
        ).count()
        
        # 6. Vendas Recentes (Últimos 10)
        vendas_recentes = Pedido.objects.filter(farmacia=farmacia).order_by('-data_criacao')[:10]
        vendas_data = []
        for v in vendas_recentes:
            vendas_data.append({
                'id': v.id,
                'numero': v.numero_pedido,
                'total': v.total,
                'status': v.status,
                'cliente': v.cliente.get_full_name() if v.cliente else 'Consumidor Final',
                'data_criacao': v.data_criacao
            })

        # 7. Notificações Críticas
        alertas = Notificacao.objects.filter(farmacia=farmacia, lida=False).count()

        return Response({
            'vendas_hoje': vendas_hoje,
            'ticket_medio': ticket_medio,
            'pedidos_pendentes': pendentes,
            'estoque_reptura': ruptura,
            'estoque_critico': critico,
            'entregas_concluidas': entregas_concluidas,
            'vendas_recentes': vendas_data,
            'alertas_pendentes': alertas
        })

from financeiro.models import Despesa

class AnalyticsReportView(APIView):
    """Relatório detalhado para análise (Gráficos e Fluxo de Caixa)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        farmacia = request.user.farmacia
        periodo = request.query_params.get('periodo', '7') # 7 dias, 30 dias
        days = int(periodo)
        start_date = timezone.now().date() - timedelta(days=days)
        
        # 1. Receitas (Vendas)
        vendas = Pedido.objects.filter(
            farmacia=farmacia,
            data_criacao__date__gte=start_date
        )
        total_receita = vendas.aggregate(total=Sum('total'))['total'] or 0

        # 2. Despesas (Todas: Pagas e Pendentes no período)
        from django.db.models import Q
        # Se PAGO, usa data_pagamento. Se PENDENTE, usa data_vencimento (previsão)
        despesas = Despesa.objects.filter(
            farmacia=farmacia
        ).filter(
            Q(status='PAGO', data_pagamento__gte=start_date) |
            Q(status='PENDENTE', data_vencimento__gte=start_date)
        )
        
        # Totais separados
        total_despesas_pagas = despesas.filter(status='PAGO').aggregate(total=Sum('valor'))['total'] or 0
        total_despesas_pendentes = despesas.filter(status='PENDENTE').aggregate(total=Sum('valor'))['total'] or 0
        
        total_despesas = total_despesas_pagas # Para o cálculo de saldo líquido hoje, usamos o pago? 
        # Ou mostramos tudo? O usuário reclamou que "não mostra". Vou somar tudo no total geral visual, mas diferenciar no detalhe.
        # "Fluxo de Caixa" costuma ser realizado. "Contas a Pagar" é futuro.
        # Vou assumir que ele quer ver o IMPACTO TOTAL do período.
        total_visual_despesas = total_despesas_pagas + total_despesas_pendentes

        # Agrupar Vendas por dia
        dias_map = {}
        for i in range(days + 1): # +1 para incluir hoje
            d = start_date + timedelta(days=i)
            d_str = d.strftime('%d/%m')
            dias_map[d_str] = {'data': d_str, 'receita': 0, 'despesa': 0, 'saldo': 0}

        # Popular Vendas
        vendas_dia = vendas.values('data_criacao__date').annotate(total=Sum('total'))
        for v in vendas_dia:
            d_str = v['data_criacao__date'].strftime('%d/%m')
            if d_str in dias_map:
                dias_map[d_str]['receita'] = float(v['total'])

        # Popular Despesas
        for d in despesas:
            # Data relevante: Pagamento ou Vencimento
            data_ref = d.data_pagamento if d.status == 'PAGO' and d.data_pagamento else d.data_vencimento
            if data_ref:
                d_str = data_ref.strftime('%d/%m')
                if d_str in dias_map:
                    dias_map[d_str]['despesa'] += float(d.valor)

        # Calcular Saldo
        grafico_dias = []
        for k, v in dias_map.items():
            v['saldo'] = v['receita'] - v['despesa']
            grafico_dias.append(v)
            
        grafico_dias.sort(key=lambda x: datetime.strptime(x['data'] + '/' + str(timezone.now().year), '%d/%m/%Y'))

        # Balanço de Pagamentos (Vendas)
        balanco_pagamento = vendas.values('forma_pagamento').annotate(
            total=Sum('total'),
            qtd=Count('id')
        )
        
         # Lista DETALHADA de transações (Vendas + Despesas)
        transacoes_list = []
        
        # Adicionar Vendas
        for pedido in vendas.select_related('cliente').prefetch_related('itens__produto').order_by('-data_criacao'):
            cliente = pedido.cliente.get_full_name() if pedido.cliente else 'Consumidor Final'
            itens = list(pedido.itens.all()[:2])
            desc = ', '.join([i.produto.nome for i in itens]) 
            if pedido.itens.count() > 2: desc += '...'
            
            transacoes_list.append({
                'id': f"V-{pedido.id}",
                'data': pedido.data_criacao,
                'tipo': 'ENTRADA',
                'descricao': f"Venda #{pedido.numero_pedido} - {cliente}",
                'detalhe': desc,
                'categoria': 'Vendas',
                'valor': float(pedido.total),
                'forma_pagamento': pedido.forma_pagamento,
                'status': 'CONCLUIDO'
            })

        # Adicionar Despesas
        for d in despesas.select_related('categoria'):
            data_ref = d.data_pagamento if d.status == 'PAGO' and d.data_pagamento else d.data_vencimento
            if not data_ref: continue
            
            dt = datetime.combine(data_ref, datetime.min.time())
            
            status_desc = 'PENDENTE' if d.status == 'PENDENTE' else 'SAÍDA'
            
            transacoes_list.append({
                'id': f"D-{d.id}",
                'data': dt, 
                'tipo': status_desc, # Diferenciar SAIDA (Paga) de PENDENTE (Futura)
                'descricao': d.titulo,
                'detalhe': d.observacoes or d.categoria.nome,
                'categoria': d.categoria.nome,
                'valor': float(d.valor) * -1,
                'forma_pagamento': 'Caixa/Banco',
                'status': d.status
            })
            
        # Ordenar tudo por data descrescente
        try:
            transacoes_list.sort(key=lambda x: x['data'], reverse=True)
        except:
             pass 

        # Calcular IVA Estimado
        taxa_iva = float(farmacia.percentual_iva or 16)
        fator = 1 + (taxa_iva / 100)
        base_tributavel = float(total_receita) / fator
        total_iva = float(total_receita) - base_tributavel

        return Response({
            'grafico_dias': grafico_dias,
            'fluxo_caixa': {
                'total_receita': float(total_receita),
                'total_despesa': float(total_visual_despesas),
                'lucro_liquido': float(total_receita - total_visual_despesas),
                'total_iva': float(total_iva),
                'taxa_iva': taxa_iva
            },
            'balanco_pagamento': balanco_pagamento,
            'transacoes': transacoes_list
        })
