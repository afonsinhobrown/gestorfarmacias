from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q
from django.utils import timezone
from entregas.models import Entregador
from farmacias.models import Farmacia
from pedidos.models import Pedido
from entregas.serializers import EntregadorSerializer

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    """Permissão apenas para administradores."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.tipo_usuario == 'ADMIN'


class AdminStatsView(APIView):
    """Estatísticas gerais da plataforma."""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Contar usuários
        total_usuarios = User.objects.count()
        total_farmacias = Farmacia.objects.filter(is_ativa=True).count()
        total_entregadores = Entregador.objects.filter(status_aprovacao='APROVADO').count()
        
        # Pedidos
        total_pedidos = Pedido.objects.count()
        pedidos_pendentes = Pedido.objects.filter(status='PENDENTE').count()
        
        # Financeiro
        receita_total = Pedido.objects.filter(
            status__in=['ENTREGUE', 'FINALIZADO']
        ).aggregate(total=Sum('valor_total'))['total'] or 0
        
        comissao_plataforma = receita_total * 0.10  # 10% de comissão
        
        # Pendências
        entregadores_pendentes = Entregador.objects.filter(status_aprovacao='PENDENTE').count()
        farmacias_pendentes = Farmacia.objects.filter(is_ativa=False).count()
        
        return Response({
            'total_usuarios': total_usuarios,
            'total_farmacias': total_farmacias,
            'total_entregadores': total_entregadores,
            'total_pedidos': total_pedidos,
            'receita_total': float(receita_total),
            'comissao_plataforma': float(comissao_plataforma),
            'pedidos_pendentes': pedidos_pendentes,
            'entregadores_pendentes': entregadores_pendentes,
            'farmacias_pendentes': farmacias_pendentes,
        })


class EntregadoresPendentesView(generics.ListAPIView):
    """Listar entregadores pendentes de aprovação."""
    permission_classes = [IsAdminUser]
    serializer_class = EntregadorSerializer
    
    def get_queryset(self):
        return Entregador.objects.filter(status_aprovacao='PENDENTE').select_related('usuario')


class AprovarEntregadorView(APIView):
    """Aprovar cadastro de entregador."""
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        try:
            entregador = Entregador.objects.get(pk=pk)
            entregador.status_aprovacao = 'APROVADO'
            entregador.data_aprovacao = timezone.now()
            entregador.aprovado_por = request.user
            entregador.is_verificado = True
            entregador.save()
            
            return Response({
                'detail': 'Entregador aprovado com sucesso',
                'entregador': EntregadorSerializer(entregador).data
            })
        except Entregador.DoesNotExist:
            return Response({
                'error': 'Entregador não encontrado'
            }, status=status.HTTP_404_NOT_FOUND)


class RejeitarEntregadorView(APIView):
    """Rejeitar cadastro de entregador."""
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        motivo = request.data.get('motivo', '')
        
        if not motivo:
            return Response({
                'error': 'Motivo da rejeição é obrigatório'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            entregador = Entregador.objects.get(pk=pk)
            entregador.status_aprovacao = 'REJEITADO'
            entregador.motivo_rejeicao = motivo
            entregador.save()
            
            return Response({
                'detail': 'Entregador rejeitado',
                'entregador': EntregadorSerializer(entregador).data
            })
        except Entregador.DoesNotExist:
            return Response({
                'error': 'Entregador não encontrado'
            }, status=status.HTTP_404_NOT_FOUND)


class AdminUserListView(generics.ListAPIView):
    """Listar todos os usuários da plataforma."""
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by('-data_criacao')
    
    def get(self, request):
        users = self.get_queryset()
        data = []
        for user in users:
            data.append({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'tipo_usuario': user.tipo_usuario,
                'telefone': user.telefone,
                'is_active': user.is_active,
                'data_criacao': user.data_criacao
            })
        return Response(data)
