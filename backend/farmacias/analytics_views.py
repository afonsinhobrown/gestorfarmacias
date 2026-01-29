from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db import models
from django.db.models import Sum, Avg, Count, Q, F, Case, When, Value, ExpressionWrapper
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
        
        # Filtros de Data
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        periodo = request.query_params.get('periodo', '7')
        
        if data_inicio_str and data_fim_str:
            start_date = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
            days = (end_date - start_date).days
        else:
            days = int(periodo)
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days)

        # 1. Receitas (Vendas)
        # Incluímos ENTREGUE (vendas de balcão/POS) e outros status concluídos
        vendas = Pedido.objects.filter(
            farmacia=farmacia,
            data_criacao__date__gte=start_date,
            data_criacao__date__lte=end_date,
            status__in=['ENTREGUE', 'PAGO', 'CONFIRMADO'] 
        ).select_related('cliente', 'vendedor')
        
        total_receita = vendas.aggregate(total=Sum('total'))['total'] or 0

        # 2. Despesas
        despesas = Despesa.objects.filter(
            farmacia=farmacia
        ).filter(
            Q(status='PAGO', data_pagamento__gte=start_date, data_pagamento__lte=end_date) |
            Q(status='PENDENTE', data_vencimento__gte=start_date, data_vencimento__lte=end_date)
        ).select_related('categoria')
        
        total_despesas_pagas = despesas.filter(status='PAGO').aggregate(total=Sum('valor'))['total'] or 0
        total_despesas_pendentes = despesas.filter(status='PENDENTE').aggregate(total=Sum('valor'))['total'] or 0
        total_visual_despesas = total_despesas_pagas + total_despesas_pendentes

        # Agrupar Vendas por dia
        dias_map = {}
        # Proteção contra períodos muito longos para não quebrar o gráfico
        safe_days = min(days, 366)
        for i in range(safe_days + 1):
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
            
        # Ordenação segura por data
        grafico_dias.sort(key=lambda x: datetime.strptime(x['data'] + '/' + str(timezone.now().year), '%d/%m/%Y'))

        # 3. Balanço de Pagamentos
        balanco_pagamento = vendas.values('forma_pagamento').annotate(
            total=Sum('total'),
            qtd=Count('id')
        )
        
        # 4. Transações detalhadas
        transacoes_list = []
        for pedido in vendas.prefetch_related('itens__produto').order_by('-data_criacao'):
            cliente = pedido.cliente.get_full_name() if pedido.cliente else 'Consumidor Final'
            itens = list(pedido.itens.all()[:2])
            desc = ', '.join([i.produto.nome for i in itens]) 
            if pedido.itens.count() > 2: desc += '...'
            
            transacoes_list.append({
                'id': f"V-{pedido.id}",
                'data': pedido.data_criacao, # Aware datetime
                'tipo': 'ENTRADA',
                'descricao': f"Venda #{pedido.numero_pedido} - {cliente}",
                'detalhe': desc,
                'categoria': 'Vendas',
                'valor': float(pedido.total),
                'forma_pagamento': pedido.forma_pagamento,
                'status': pedido.status
            })

        for d in despesas:
            data_ref = d.data_pagamento if d.status == 'PAGO' and d.data_pagamento else d.data_vencimento
            if not data_ref: continue
            
            # Converter Date para Aware Datetime para evitar erro de comparação no sort
            dt = timezone.make_aware(datetime.combine(data_ref, datetime.min.time()))
            
            status_desc = 'PENDENTE' if d.status == 'PENDENTE' else 'SAÍDA'
            transacoes_list.append({
                'id': f"D-{d.id}",
                'data': dt, 
                'tipo': status_desc,
                'descricao': d.titulo,
                'detalhe': d.observacoes or d.categoria.nome,
                'categoria': d.categoria.nome,
                'valor': float(d.valor) * -1,
                'forma_pagamento': 'Caixa/Banco',
                'status': d.status
            })
        
        # O sort agora funciona pois todos são aware datetimes
        transacoes_list.sort(key=lambda x: x['data'], reverse=True)

        # 5. Mais Vendidos e Menos Vendidos
        from pedidos.models import ItemPedido
        itens_query = ItemPedido.objects.filter(
            pedido__farmacia=farmacia,
            pedido__data_criacao__date__gte=start_date,
            pedido__status__in=['ENTREGUE', 'PAGO', 'CONFIRMADO']
        )
        
        ranking_produtos = itens_query.values(
            'produto__id', 'produto__nome'
        ).annotate(
            total_qtd=Sum('quantidade'),
            total_venda=Sum('subtotal'),
        ).order_by('-total_qtd')

        # 6. Vendas por Usuário (Vendedor)
        vendas_vendedor = vendas.values(
            'vendedor__id', 'vendedor__first_name', 'vendedor__last_name', 'vendedor__email'
        ).annotate(
            total_vendas=Sum('total'),
            count=Count('id')
        ).order_by('-total_vendas')

        # 7. Produtos com maior margem
        maiores_margens_qs = EstoqueProduto.objects.filter(
            farmacia=farmacia,
            quantidade__gt=0
        ).select_related('produto').annotate(
            margem_valor=F('preco_venda') - F('preco_custo')
        ).annotate(
            margem_percentual=Case(
                When(preco_venda__gt=0, then=ExpressionWrapper(
                    F('margem_valor') * 100.0 / F('preco_venda'),
                    output_field=models.FloatField()
                )),
                default=Value(0.0),
                output_field=models.FloatField()
            )
        ).order_by('-margem_percentual')[:10]

        # 8. IVA Estimado
        taxa_iva = float(farmacia.percentual_iva or 16)
        fator = 1 + (taxa_iva / 100)
        base_tributavel = float(total_receita) / fator if total_receita > 0 else 0
        total_iva = float(total_receita) - base_tributavel

        # 9. Lucro por Categoria
        lucro_categoria = itens_query.values(
            categoria_nome=F('produto__categoria__nome')
        ).annotate(
            receita=Sum('subtotal'),
            custo=Sum(F('quantidade') * F('estoque__preco_custo')),
        ).annotate(
            lucro=F('receita') - F('custo')
        ).order_by('-lucro')

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
            'transacoes': transacoes_list,
            'mais_vendidos': ranking_produtos[:10],
            'menos_vendidos': ranking_produtos.reverse()[:10],
            'vendas_vendedor': vendas_vendedor,
            'lucro_categoria': lucro_categoria,
            'maiores_margens': [
                {
                    'id': m.produto.id,
                    'nome': m.produto.nome,
                    'preco_venda': float(m.preco_venda),
                    'preco_custo': float(m.preco_custo),
                    'margem_percentual': float(m.margem_percentual)
                } for m in maiores_margens_qs
            ]
        })
