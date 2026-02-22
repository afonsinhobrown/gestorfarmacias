from django.utils import timezone
from django.db.models import F, Sum, Q
from django.db.models.functions import Abs
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .models import SessaoCaixa
from .serializers import SessaoCaixaSerializer

class AdminAuditoriaCaixaView(APIView):
    """View para o Administrador auditar todas as sessões e identificar fraudes/erros."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # Superando Primavera: Filtro automático de Sessões Críticas
        # Uma sessão é crítica se a diferença absoluta for maior que 5% do total do sistema
        
        limite_fraude = 0.05 # 5%
        
        sessoes = SessaoCaixa.objects.select_related('operador', 'caixa').all()
        
        # Filtro de discrepâncias significativas
        criticas = sessoes.filter(status='FECHADO').annotate(
            diff_abs=Abs(F('diferenca'))
        ).filter(
            diff_abs__gt=F('total_sistema') * limite_fraude
        ).order_by('-data_fechamento')
        
        stats = {
            'total_sessoes_hoje': sessoes.filter(data_abertura__date=timezone.now().date()).count(),
            'total_quebras_mes': sessoes.filter(
                data_fechamento__month=timezone.now().month,
                diferenca__lt=0
            ).aggregate(Sum('diferenca'))['diferenca__sum'] or 0,
            'sessoes_criticas': SessaoCaixaSerializer(criticas[:10], many=True).data
        }
        
        return Response(stats)
