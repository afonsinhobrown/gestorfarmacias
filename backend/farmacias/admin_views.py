from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Farmacia, Gibagio, Licenca
from .serializers import FarmaciaDetailSerializer, FarmaciaListSerializer, GibagioSerializer, LicencaSerializer
from accounts.admin_views import IsAdminUser

class AdminFarmaciaViewSet(viewsets.ModelViewSet):
    """ViewSet para administração de farmácias pelo Super Admin."""
    permission_classes = [IsAdminUser]
    queryset = Farmacia.objects.all().order_by('-data_criacao')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FarmaciaListSerializer
        return FarmaciaDetailSerializer

    @action(detail=True, methods=['post'])
    def renovar_licenca(self, request, pk=None):
        farmacia = self.get_object()
        tipo = request.data.get('tipo', 'MENSAL')
        meses = 1 if tipo == 'MENSAL' else 12
        
        from django.utils import timezone
        from datetime import timedelta
        
        inicio = timezone.now().date()
        fim = inicio + timedelta(days=30 * meses)
        
        # Inativar outras
        Licenca.objects.filter(farmacia=farmacia).update(is_ativa=False)
        
        licenca = Licenca.objects.create(
            farmacia=farmacia,
            tipo=tipo,
            data_inicio=inicio,
            data_fim=fim,
            is_ativa=True,
            paga=True
        )
        
        return Response(LicencaSerializer(licenca).data)

class AdminGibagioViewSet(viewsets.ModelViewSet):
    """ViewSet para gestão de unidades Gibagio."""
    permission_classes = [IsAdminUser]
    queryset = Gibagio.objects.all().order_by('nome')
    serializer_class = GibagioSerializer

class AdminLicencaViewSet(viewsets.ModelViewSet):
    """ViewSet para consulta global de licenças."""
    permission_classes = [IsAdminUser]
    queryset = Licenca.objects.all().order_by('-data_inicio')
    serializer_class = LicencaSerializer
