from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Farmacia, AvaliacaoFarmacia, Notificacao
from .serializers import (
    FarmaciaListSerializer, FarmaciaDetailSerializer, 
    AvaliacaoFarmaciaSerializer, NotificacaoSerializer
)
from django.db.models import F, FloatField
from django.db.models.functions import Cast

class FarmaciaListView(generics.ListAPIView):
    """
    Lista todas as farmácias ativas.
    Suporta filtragem por cidade, bairro, funcionamento 24h, entrega, etc.
    Suporta busca por nome.
    """
    queryset = Farmacia.objects.filter(is_ativa=True)
    serializer_class = FarmaciaListSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('cidade', 'provincia', 'bairro', 'funciona_24h', 'aceita_entregas', 'is_verificada')
    search_fields = ('nome', 'nome_fantasia')
    ordering_fields = ('nota_media', 'nome')
    ordering = ('-nota_media',)


class FarmaciaDetailView(generics.RetrieveAPIView):
    """Detalhes de uma farmácia específica."""
    queryset = Farmacia.objects.filter(is_ativa=True)
    serializer_class = FarmaciaDetailSerializer
    permission_classes = (permissions.AllowAny,)


class FarmaciaAvaliacaoCreateView(generics.CreateAPIView):
    """Cria uma nova avaliação para uma farmácia."""
    queryset = AvaliacaoFarmacia.objects.all()
    serializer_class = AvaliacaoFarmaciaSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        farmacia_id = self.kwargs.get('pk')
        farmacia = Farmacia.objects.get(pk=farmacia_id)
        serializer.save(usuario=self.request.user, farmacia=farmacia)


class NotificacaoListView(generics.ListAPIView):
    """Lista notificações para a farmácia do usuário logado."""
    serializer_class = NotificacaoSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Apenas se o usuário for do tipo FARMACIA ou ADMIN
        if hasattr(self.request.user, 'farmacia'):
            return Notificacao.objects.filter(farmacia=self.request.user.farmacia).order_by('-lida', '-data_criacao')
        return Notificacao.objects.none()


class NotificacaoMarcarLidaView(APIView):
    """Marca uma ou todas as notificações como lida."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk=None):
        if not hasattr(request.user, 'farmacia'):
            return Response({'error': 'Apenas farmácias podem acessar este recurso'}, status=status.HTTP_403_FORBIDDEN)
            
        if pk:
            # Marcar uma específica
            try:
                notif = Notificacao.objects.get(pk=pk, farmacia=request.user.farmacia)
                notif.lida = True
                notif.save()
                return Response({'status': 'lida'})
            except Notificacao.DoesNotExist:
                return Response({'error': 'Notificação não encontrada'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Marcar todas
            Notificacao.objects.filter(farmacia=request.user.farmacia, lida=False).update(lida=True)
            return Response({'status': 'todas marcadas como lidas'})


class MinhaFarmaciaView(generics.RetrieveUpdateAPIView):
    """Visualiza e atualiza os dados da farmácia do usuário logado."""
    serializer_class = FarmaciaDetailSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        try:
            return self.request.user.farmacia
        except Farmacia.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Você não possui uma farmácia vinculada.")
