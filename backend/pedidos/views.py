from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
from .models import Pedido
from .serializers import PedidoCreateSerializer, PedidoListSerializer, PedidoDetailSerializer, VendaBalcaoSerializer

# Imports para PDF
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from io import BytesIO

class VendaBalcaoView(APIView):
    """Processa uma venda de balcão completa (POS)."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        print(f"PAYLOAD RECEBIDO: {request.data}") # DEBUG PAYLOAD
        try:
            serializer = VendaBalcaoSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                pedido = serializer.save()
                
                # Construir dados para o recibo fiscal com segurança
                try:
                    return Response(serializer.to_representation(pedido), status=status.HTTP_201_CREATED)
                except Exception as e:
                    print(f"ERRO AO GERAR DADOS DO RECIBO: {e}")
                    # Mesmo se falhar ao gerar recibo, a venda foi criada
                    return Response({'id': pedido.id, 'message': 'Venda criada, mas erro ao gerar recibo'}, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e), 'detail': 'Erro interno no processamento da venda'}, status=status.HTTP_400_BAD_REQUEST)



class PedidoCreateView(generics.CreateAPIView):
    """Cria um novo pedido."""
    queryset = Pedido.objects.all()
    serializer_class = PedidoCreateSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)


class PedidoListView(generics.ListAPIView):
    """Lista os pedidos do usuário logado com suporte a filtragem avançada."""
    serializer_class = PedidoListSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = {
        'status': ['exact', 'in'],
        'pago': ['exact'],
        'data_criacao': ['gte', 'lte', 'date'],
        'forma_pagamento': ['exact'],
    }
    search_fields = ('numero_pedido', 'cliente__first_name', 'cliente__last_name', 'cliente__email')
    ordering = ('-data_criacao',)

    def get_queryset(self):
        user = self.request.user
        # Se for cliente, vê os seus pedidos
        if user.tipo_usuario == 'CLIENTE':
            return Pedido.objects.filter(cliente=user)
        # Se for farmácia, vê os pedidos recebidos
        elif hasattr(user, 'farmacia'):
            return Pedido.objects.filter(farmacia=user.farmacia).select_related('cliente')
        # Se for admin, vê todos
        elif user.is_staff:
            return Pedido.objects.all().select_related('cliente', 'farmacia')
        return Pedido.objects.none()


class PedidoDetailView(generics.RetrieveUpdateAPIView):
    """Detalhes do pedido, permitindo atualização de status (para farmácia)."""
    queryset = Pedido.objects.all()
    serializer_class = PedidoDetailSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.tipo_usuario == 'CLIENTE':
            return Pedido.objects.filter(cliente=user)
        elif hasattr(user, 'farmacia'):
            return Pedido.objects.filter(farmacia=user.farmacia)
        return Pedido.objects.all() if user.is_staff else Pedido.objects.none()

class AtualizarStatusPedidoView(APIView):
    """Permite atualizar o status do pedido (Farmácia, Motoboy ou Admin)."""
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, pk):
        pedido = generics.get_object_or_404(Pedido, pk=pk)
        novo_status = request.data.get('status')
        
        if novo_status not in Pedido.StatusPedido.values:
            return Response({"erro": "Status inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Logica de permissão simples:
        # No futuro, validar se o motoboy pode mudar só para 'Entregue', etc.
        pedido.status = novo_status
        pedido.save()
        
        return Response({
            "mensagem": f"Status do pedido #{pedido.numero_pedido} atualizado para {novo_status}",
            "status": pedido.status
        })

class AnularPedidoView(APIView):
    """Anula um pedido/venda e devolve itens ao estoque."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        pedido = generics.get_object_or_404(Pedido, pk=pk)
        
        # Validar farmácia
        if pedido.farmacia != request.user.farmacia:
             return Response({"erro": "Não autorizado"}, status=status.HTTP_403_FORBIDDEN)
             
        motivo = request.data.get('motivo', 'Anulação solicitada pelo usuário')
        
        try:
            pedido.anular_venda(motivo=motivo, usuario=request.user)
            return Response({"mensagem": f"Venda {pedido.numero_pedido} anulada com sucesso."})
        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ExtratoVendasView(APIView):
    """Extrato de vendas detalhado com lucro (Estilo Primavera/ERP)."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        farmacia = request.user.farmacia
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        vendedor_id = request.query_params.get('vendedor')
        export_csv = request.query_params.get('export') == 'true'
        
        # Segurança: Se não for Gerente/Admin, vê apenas as SUAS vendas
        if request.user.tipo_usuario not in ['ADMIN', 'FARMACIA']:
            pedidos = Pedido.objects.filter(farmacia=farmacia, vendedor=request.user)
        else:
            pedidos = Pedido.objects.filter(farmacia=farmacia)
            
        pedidos = pedidos.exclude(status='CANCELADO').select_related('vendedor', 'cliente').order_by('-data_criacao')
        
        if data_inicio:
            pedidos = pedidos.filter(data_criacao__date__gte=data_inicio)
        if data_fim:
            pedidos = pedidos.filter(data_criacao__date__lte=data_fim)
        if vendedor_id:
            pedidos = pedidos.filter(vendedor_id=vendedor_id)
            
        if export_csv:
            import csv
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="extrato_vendas_{timezone.now().strftime("%Y%m%d")}.csv"'
            writer = csv.writer(response)
            writer.writerow(['Pedido', 'Data', 'Cliente', 'Vendedor', 'Pagamento', 'Total', 'Lucro'])
            for p in pedidos:
                # Calcular lucro rapidamente para o CSV
                lucro = sum(float(i.preco_unitario - (i.estoque.preco_custo if i.estoque else 0)) * i.quantidade for i in p.itens.all())
                writer.writerow([p.numero_pedido, p.data_criacao, p.cliente.get_full_name() if p.cliente else 'Balcão', p.vendedor.get_full_name() if p.vendedor else '-', p.forma_pagamento, p.total, round(lucro, 2)])
            return response
            
        dados = []
        total_geral_faturado = 0
        total_geral_lucro = 0
        total_geral_iva = 0
        
        for p in pedidos:
            lucro_pedido = 0
            iva_pedido = 0
            for item in p.itens.all():
                # Proteção contra Estoque removido ou preços nulos
                custo = float(item.estoque.preco_custo if item.estoque else 0)
                venda = float(item.preco_unitario or 0)
                lucro_item = (venda - custo) * (item.quantidade or 0)
                lucro_pedido += lucro_item

                # Cálculo Item a Item de IVA
                if not item.produto.is_isento_iva:
                    taxa = float(item.produto.taxa_iva or 16) / 100
                    valor_com_iva = float(item.subtotal)
                    base = valor_com_iva / (1 + taxa)
                    iva_item = valor_com_iva - base
                    iva_pedido += iva_item
            
            total_geral_faturado += float(p.total or 0)
            total_geral_lucro += lucro_pedido
            total_geral_iva += iva_pedido
            
            dados.append({
                'id': p.id,
                'numero': p.numero_pedido,
                'data': p.data_criacao,
                'cliente': p.cliente.get_full_name() if p.cliente else 'Consumidor Final',
                'vendedor': p.vendedor.get_full_name() if p.vendedor else 'Sistema',
                'forma_pagamento': p.forma_pagamento,
                'total': float(p.total or 0),
                'iva': round(iva_pedido, 2),
                'lucro': round(lucro_pedido, 2),
                'margem': round((lucro_pedido / float(p.total) * 100), 2) if p.total and float(p.total) > 0 else 0
            })
            
        return Response({
            'periodo': {'inicio': data_inicio, 'fim': data_fim},
            'resumo': {
                'total_faturado': round(total_geral_faturado, 2),
                'total_iva': round(total_geral_iva, 2),
                'total_lucro': round(total_geral_lucro, 2),
                'margem_media': round((total_geral_lucro / total_geral_faturado * 100), 2) if total_geral_faturado > 0 else 0
            },
            'vendas': dados
        })

class ComissaoView(APIView):
    """Cálculo de comissões por vendedor."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        from accounts.models import User
        from django.db.models import Sum, Q
        
        try:
            farmacia = request.user.farmacia
            
            if not farmacia:
                return Response(
                    {'error': 'Usuário não está associado a nenhuma farmácia'},
                    status=400
                )
            
            data_inicio = request.query_params.get('data_inicio')
            data_fim = request.query_params.get('data_fim')
            vendedor_especifico = request.query_params.get('vendedor')
            
            # Filtro de pedidos concluídos e pagos
            pedidos = Pedido.objects.filter(farmacia=farmacia, status='ENTREGUE', pago=True)
            
            if data_inicio:
                pedidos = pedidos.filter(data_criacao__date__gte=data_inicio)
            if data_fim:
                pedidos = pedidos.filter(data_criacao__date__lte=data_fim)
                
            # Buscar usuários da farmácia
            vendedores_qs = User.objects.filter(
                Q(farmacia_perfil=farmacia) | 
                Q(funcionario_perfil__farmacia=farmacia)
            ).distinct()

            if vendedor_especifico:
                vendedores_qs = vendedores_qs.filter(id=vendedor_especifico)
            
            relatorio = []
            total_geral_comissoes = 0
            
            for v in vendedores_qs:
                itens_vendedor = ItemPedido.objects.filter(
                    pedido__in=pedidos,
                    pedido__vendedor=v
                )
                
                stats = itens_vendedor.aggregate(
                    total_vendas=Sum('subtotal'),
                    total_comissoes=Sum('valor_comissao')
                )
                
                faturado = float(stats['total_vendas'] or 0)
                comissao_acumulada = float(stats['total_comissoes'] or 0)
                qtd_vendas = pedidos.filter(vendedor=v).count()
                
                # Sempre incluir no relatório para o gestor ver a lista completa da equipa
                relatorio.append({
                    'vendedor_id': v.id,
                    'nome': v.get_full_name(),
                    'total_vendas': faturado,
                    'quantidade_vendas': qtd_vendas,
                    'comissao': comissao_acumulada,
                    'percentual_medio': round((comissao_acumulada / faturado * 100), 2) if faturado > 0 else 0
                })
                total_geral_comissoes += comissao_acumulada
            
            # Resumo de Meta e Bónus
            total_vendas_periodo = sum(v['total_vendas'] for v in relatorio)
            meta_mensal = float(farmacia.meta_bonus_mensal or 0)
            meta_atingida = total_vendas_periodo >= meta_mensal if meta_mensal > 0 else False
            
            return Response({
                'periodo': {'inicio': data_inicio, 'fim': data_fim},
                'farmacia': {
                    'meta_bonus': meta_mensal,
                    'total_vendas': total_vendas_periodo,
                    'meta_atingida': meta_atingida,
                    'percentual_bonus_extra': float(farmacia.percentual_bonus_extra or 0)
                },
                'vendedores': sorted(relatorio, key=lambda x: x['total_vendas'], reverse=True),
                'total_geral_comissoes': total_geral_comissoes
            })
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erro ao processar relatório de comissões: {str(e)}'},
                status=500
            )

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum
        from django.utils import timezone
        from produtos.models import EstoqueProduto
        from .models import Pedido
        from .serializers import PedidoListSerializer

        try:
            # Busca a farmácia associada ao usuário
            farmacia = getattr(request.user, 'farmacia', None)

            if not farmacia:
                if request.user.tipo_usuario == 'ADMIN':
                     return Response({
                         "vendas_hoje": "0.00", 
                         "pedidos_pendentes": 0, 
                         "estoque_critico": 0, 
                         "entregas_concluidas": 0, 
                         "ultimos_pedidos": []
                     })
                return Response({"erro": "Farmácia não encontrada para este usuário."}, status=400)

            hoje = timezone.now().date()
            
            # Base de pedidos da farmácia
            qs_base = Pedido.objects.filter(farmacia=farmacia)

            # Estatísticas Financeiras
            stats_vendas = qs_base.filter(data_criacao__date=hoje).aggregate(total_dia=Sum('total'))
            vendas_hoje = stats_vendas['total_dia'] or 0

            # Contadores de Status
            pedidos_pendentes = qs_base.filter(status='PENDENTE').count()
            entregas_concluidas = qs_base.filter(status='ENTREGUE', data_criacao__date=hoje).count()

            # Estoque
            estoque_critico = EstoqueProduto.objects.filter(farmacia=farmacia, quantidade__lte=5).count()

            # Últimos Pedidos (Formatados de forma segura)
            ultimos_pedidos = qs_base.order_by('-data_criacao')[:5]
            ultimos_data = PedidoListSerializer(ultimos_pedidos, many=True).data

            return Response({
                "vendas_hoje": f"{float(vendas_hoje):.2f}",
                "pedidos_pendentes": pedidos_pendentes,
                "estoque_critico": estoque_critico,
                "entregas_concluidas": entregas_concluidas,
                "ultimos_pedidos": ultimos_data
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"erro": "Erro interno ao processar estatísticas", "detalhe": str(e)}, status=500)


class MeusPedidosView(generics.ListAPIView):
    """Lista os pedidos do cliente logado."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PedidoListSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering = ['-data_criacao']

    def get_queryset(self):
        return Pedido.objects.filter(cliente=self.request.user).prefetch_related('itens', 'itens__produto')


class RelatorioVendasPDFView(APIView):
    """Gera um PDF PROFISSIONAL com relatório fiscal completo (Vendas + Despesas)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from django.db.models import Sum, Count, Q
        from datetime import datetime
        from financeiro.models import Despesa

        user = request.user
        farmacia = getattr(user, 'farmacia', None)
        if not farmacia:
            return Response({"erro": "Farmácia não identificada"}, status=400)

        # Parâmetros de data
        hoje = timezone.now().date()
        try:
            data_inicio = request.GET.get('data_inicio', hoje.strftime('%Y-%m-%d'))
            data_fim = request.GET.get('data_fim', hoje.strftime('%Y-%m-%d'))
        except:
            data_inicio = hoje
            data_fim = hoje

        # 1. Buscar Vendas (Receitas)
        pedidos = Pedido.objects.filter(
            farmacia=farmacia,
            data_criacao__date__gte=data_inicio,
            data_criacao__date__lte=data_fim
        ).select_related('cliente').order_by('data_criacao')

        total_receita = pedidos.aggregate(Sum('total'))['total__sum'] or 0
        qtd_vendas = pedidos.count()

        # 2. Buscar Despesas (Saídas) - Pagas e Pendentes
        despesas = Despesa.objects.filter(
            farmacia=farmacia,
        ).filter(
            Q(status='PAGO', data_pagamento__gte=data_inicio, data_pagamento__lte=data_fim) |
            Q(status='PENDENTE', data_vencimento__gte=data_inicio, data_vencimento__lte=data_fim)
        )
        
        total_despesas_pagas = despesas.filter(status='PAGO').aggregate(Sum('valor'))['valor__sum'] or 0
        total_despesas_pendentes = despesas.filter(status='PENDENTE').aggregate(Sum('valor'))['valor__sum'] or 0
        total_despesas_geral = total_despesas_pagas + total_despesas_pendentes

        # 3. Lucro Líquido
        lucro_liquido = total_receita - total_despesas_geral

        # 4. Unificar Transações para Listagem
        transacoes = []
        for p in pedidos:
            transacoes.append({
                'data': p.data_criacao,
                'descricao': f"Venda #{p.numero_pedido} - {p.cliente.get_full_name() if p.cliente else 'Balcão'}",
                'tipo': 'ENTRADA',
                'metodo': p.forma_pagamento,
                'valor': p.total
            })
            
        for d in despesas:
            data_ref = d.data_pagamento if d.status == 'PAGO' and d.data_pagamento else d.data_vencimento
            if not data_ref: continue
            # Converter date para datetime para sort compativel
            dt = datetime.combine(data_ref, datetime.min.time())
            try:
                dt = timezone.make_aware(dt)
            except:
                pass # Se der erro (ex: settings TZ=False), mantem naive
            
            transacoes.append({
                'data': dt,
                'descricao': f"Despesa: {d.titulo} ({d.status})",
                'tipo': 'SAIDA',
                'metodo': 'Caixa' if d.status == 'PAGO' else 'Pendente',
                'valor': d.valor * -1 # Negativo
            })
            
        # Ordenar e Preparar PDF
        transacoes.sort(key=lambda x: x['data'])

        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        y = height - 1.5 * cm

        def draw_header():
            nonlocal y
            # Tentar desenhar o logotipo se existir
            if farmacia.logo:
                try:
                    p.drawImage(farmacia.logo.path, 1.5 * cm, height - 2.5 * cm, width=2.5 * cm, preserveAspectRatio=True, mask='auto')
                except Exception as e:
                    print(f"Erro ao carregar logo no PDF: {e}")

            p.setFont("Helvetica-Bold", 16)
            p.drawCentredString(width / 2, height - 1.5 * cm, farmacia.nome.upper())
            p.setFont("Helvetica", 9)
            p.drawCentredString(width / 2, height - 2.0 * cm, "RELATÓRIO FINANCEIRO COMPLETO (FISCAL)")
            p.drawCentredString(width / 2, height - 2.4 * cm, f"Período: {data_inicio} a {data_fim} | Emitido: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
            p.line(1 * cm, height - 2.8 * cm, width - 1 * cm, height - 2.8 * cm)
            y = height - 3.5 * cm

        draw_header()

        # ============ RESUMO FINANCEIRO ============
        p.setFont("Helvetica-Bold", 12)
        p.drawString(2 * cm, y, "RESUMO DO PERÍODO & IMPOSTOS")
        y -= 0.8 * cm
        
        # Cálculos de Imposto (IVA Incluso)
        # Se 16%: Base = Total / 1.16 | IVA = Total - Base
        taxa_iva = float(farmacia.percentual_iva or 16)
        fator = 1 + (taxa_iva / 100)
        
        base_tributavel = float(total_receita) / fator
        valor_iva = float(total_receita) - base_tributavel
        
        # Bloco de Receita com Impostos
        p.setFillColorRGB(0.95, 0.95, 0.95)
        p.rect(1.5 * cm, y - 2.5 * cm, width - 3 * cm, 2.5 * cm, fill=1, stroke=0)
        p.setFillColorRGB(0, 0, 0)
        
        y -= 0.5 * cm
        p.setFont("Helvetica-Bold", 10)
        p.drawString(2 * cm, y, "FATURAMENTO BRUTO (Total de Vendas):")
        p.drawRightString(width - 2 * cm, y, f"+ {total_receita:,.2f} MT")
        y -= 0.5 * cm
        
        p.setFont("Helvetica", 9)
        p.drawString(2 * cm, y, f"(-) IVA Incluído ({taxa_iva}%):")
        p.drawRightString(width - 2 * cm, y, f"{valor_iva:,.2f} MT")
        y -= 0.5 * cm
        
        p.drawString(2 * cm, y, "(=) Base de Incidência Líquida:")
        p.drawRightString(width - 2 * cm, y, f"{base_tributavel:,.2f} MT")
        y -= 1 * cm # Margem extra após o bloco
        
        p.setFont("Helvetica", 10)
        # Despesas
        p.drawString(2 * cm, y, "Total de Saídas (Despesas):")
        p.drawRightString(width - 2 * cm, y, f"- {total_despesas_geral:,.2f} MT")
        y -= 0.5 * cm
        
        # Linha Saldo
        y -= 0.2 * cm
        p.line(10 * cm, y, width - 2 * cm, y)
        y -= 0.6 * cm
        
        # Lucro
        # Lucro REAL deveria ser sobre a Base Limpa? Geralmente Fluxo de Caixa é sobre o dinheiro bruto que entrou vs saiu.
        # Mas contabelmente, imposto não é receita.
        # Vamos manter o Lucro de Caixa (Bruto - Despesas) mas indicar o peso do imposto acima.
        
        p.setFont("Helvetica-Bold", 12)
        p.drawString(2 * cm, y, "RESULTADO LÍQUIDO (CAIXA):")
        if lucro_liquido >= 0:
            p.setFillColorRGB(0, 0.5, 0) # Verde escuro
        else:
            p.setFillColorRGB(0.8, 0, 0) # Vermelho
            
        p.drawRightString(width - 2 * cm, y, f"{lucro_liquido:,.2f} MT")
        p.setFillColorRGB(0, 0, 0) # Reset cor
        y -= 1.5 * cm

        # ============ LISTA DE TRANSAÇÕES ============
        p.setFont("Helvetica-Bold", 11)
        p.drawString(1 * cm, y, "DETALHAMENTO DE MOVIMENTAÇÕES")
        y -= 0.8 * cm
        
        # Cabeçalho Tabela
        p.setFillColorRGB(0.9, 0.9, 0.9)
        p.rect(1 * cm, y - 0.2 * cm, width - 2 * cm, 0.6 * cm, fill=1, stroke=0)
        p.setFillColorRGB(0, 0, 0)
        p.setFont("Helvetica-Bold", 8)
        p.drawString(1.2 * cm, y, "DATA")
        p.drawString(4 * cm, y, "DESCRIÇÃO")
        p.drawString(12 * cm, y, "MÉTODO")
        p.drawRightString(width - 1.2 * cm, y, "VALOR (MT)")
        y -= 0.6 * cm
        
        p.setFont("Helvetica", 8)
        
        for item in transacoes:
            # Verificar Quebra de Página
            if y < 2 * cm:
                p.showPage()
                draw_header()
                # Repetir cabeçalho tabela
                p.setFont("Helvetica-Bold", 11)
                p.drawString(1 * cm, y, "DETALHAMENTO (CONT.)")
                y -= 0.8 * cm
                p.setFillColorRGB(0.9, 0.9, 0.9)
                p.rect(1 * cm, y - 0.2 * cm, width - 2 * cm, 0.6 * cm, fill=1, stroke=0)
                p.setFillColorRGB(0, 0, 0)
                p.setFont("Helvetica-Bold", 8)
                p.drawString(1.2 * cm, y, "DATA")
                p.drawString(4 * cm, y, "DESCRIÇÃO")
                p.drawString(12 * cm, y, "MÉTODO")
                p.drawRightString(width - 1.2 * cm, y, "VALOR (MT)")
                y -= 0.6 * cm
                p.setFont("Helvetica", 8)

            # Desenhar Linha
            data_str = item['data'].strftime('%d/%m/%Y %H:%M')
            if item['tipo'] == 'ENTRADA':
                p.setFillColorRGB(0, 0.4, 0)
            else:
                p.setFillColorRGB(0.6, 0, 0)
                
            p.drawString(1.2 * cm, y, data_str)
            
            p.setFillColorRGB(0, 0, 0) # Descrição preta
            desc = item['descricao'][:50] # Truncar
            p.drawString(4 * cm, y, desc)
            p.drawString(12 * cm, y, item['metodo'])
            
            if item['tipo'] == 'ENTRADA':
                p.setFillColorRGB(0, 0, 0) # Valor normal
            else:
                p.setFillColorRGB(0.8, 0, 0) # Vermelho se saída
                
            p.drawRightString(width - 1.2 * cm, y, f"{item['valor']:,.2f}")
            
            p.setFillColorRGB(0, 0, 0) # Reset
            
            # Linha fina separadora
            p.setLineWidth(0.5)
            p.setStrokeColorRGB(0.9, 0.9, 0.9)
            p.line(1 * cm, y - 0.1 * cm, width - 1 * cm, y - 0.1 * cm)
            
            y -= 0.5 * cm

        p.showPage()
        p.save()
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f"relatorio_financeiro_{hoje.strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
