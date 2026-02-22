from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, 
    UserUpdateSerializer, 
    CustomTokenObtainPairSerializer,
    FarmaciaRegistroSerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """Endpoint para registro de novos usuários (CLIENTES)."""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        try:
            # Preparar dados
            nome_completo = request.data.get('nome', '')
            partes_nome = nome_completo.split(' ', 1)
            first_name = partes_nome[0]
            last_name = partes_nome[1] if len(partes_nome) > 1 else ''
            
            user_data = {
                'email': request.data.get('email'),
                'password': request.data.get('password'),
                'first_name': first_name,
                'last_name': last_name,
                'telefone': request.data.get('telefone'),
                'tipo_usuario': 'CLIENTE',
                'foto_perfil': request.FILES.get('foto_perfil'),
                'foto_documento': request.FILES.get('foto_documento')
            }
            
            # Validar se email já existe
            if User.objects.filter(email=user_data['email']).exists():
                return Response({'error': 'Email já cadastrado'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Criar usuário
            user = User.objects.create_user(**user_data)
            
            return Response({
                'detail': 'Usuário cadastrado com sucesso!',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FarmaciaRegistroView(generics.CreateAPIView):
    """Endpoint para registro de farmácias (cria User + Farmacia)."""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = FarmaciaRegistroSerializer

    def create(self, request, *args, **kwargs):
        from farmacias.models import Farmacia
        from django.db import transaction
        
        try:
            with transaction.atomic():
                # Extrair dados do usuário e da farmácia
                user_data = request.data.get('user', {})
                farmacia_data = request.data.get('farmacia', {})
                
                # Validar se email já existe
                email = user_data.get('email')
                if not email:
                    return Response({'error': 'Email é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
                    
                if User.objects.filter(email=email).exists():
                    return Response({'error': 'Email já cadastrado'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Validar NUIT único
                nuit = farmacia_data.get('nuit')
                if not nuit:
                    return Response({'error': 'NUIT é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
                    
                if Farmacia.objects.filter(nuit=nuit).exists():
                    return Response({'error': 'NUIT já cadastrado'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Criar usuário (dono da farmácia)
                user = User.objects.create_user(
                    email=email,
                    password=user_data.get('password'),
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    telefone=user_data.get('telefone', ''),
                    tipo_usuario='FARMACIA'
                )
                
                # Criar farmácia
                farmacia = Farmacia.objects.create(
                    usuario=user,
                    nome=farmacia_data.get('nome'),
                    nome_fantasia=farmacia_data.get('nome_fantasia', ''),
                    nuit=nuit,
                    alvara=farmacia_data.get('alvara', ''),
                    telefone_principal=farmacia_data.get('telefone_principal'),
                    telefone_alternativo=farmacia_data.get('telefone_alternativo', ''),
                    email=farmacia_data.get('email', email),
                    endereco=farmacia_data.get('endereco'),
                    bairro=farmacia_data.get('bairro', ''),
                    cidade=farmacia_data.get('cidade', 'Maputo'),
                    provincia=farmacia_data.get('provincia', 'Maputo'),
                    codigo_postal=farmacia_data.get('codigo_postal', ''),
                    latitude=farmacia_data.get('latitude', '-25.9655'),
                    longitude=farmacia_data.get('longitude', '32.5832'),
                    is_ativa=True,  # Ativa imediatamente (pode mudar para False se quiser aprovação)
                    is_verificada=False
                )
                
                return Response({
                    'detail': 'Farmácia cadastrada com sucesso!',
                    'user': UserSerializer(user).data,
                    'farmacia_id': farmacia.id
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Erro ao cadastrar farmácia: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class MotoboyRegistroView(generics.CreateAPIView):
    """Endpoint para registro de motoboys (cria User + Entregador)."""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    
    def create(self, request, *args, **kwargs):
        from entregas.models import Entregador
        from django.db import transaction
        import uuid
        
        try:
            with transaction.atomic():
                # Criar usuário
                nome_completo = request.data.get('nome', '')
                partes_nome = nome_completo.split(' ', 1)
                first_name = partes_nome[0] if partes_nome else ''
                last_name = partes_nome[1] if len(partes_nome) > 1 else ''
                
                user_data = {
                    'email': request.data.get('email'),
                    'password': request.data.get('password'),
                    'first_name': first_name,
                    'last_name': last_name,
                    'telefone': request.data.get('telefone'),
                    'tipo_usuario': 'ENTREGADOR'
                }
                
                user = User.objects.create_user(**user_data)
                
                # Gerar documento único temporário
                doc_temp = f"TEMP-{uuid.uuid4().hex[:8].upper()}"
                
                # Criar entregador com todos os campos
                entregador = Entregador.objects.create(
                    usuario=user,
                    # Dados pessoais
                    documento_identidade=doc_temp,
                    data_nascimento=request.data.get('data_nascimento', '2000-01-01'),
                    foto_perfil=request.FILES.get('foto_perfil'),
                    foto_documento=request.FILES.get('foto_documento'),
                    # Veículo
                    tipo_veiculo=request.data.get('tipo_veiculo', 'MOTO'),
                    placa_veiculo=request.data.get('placa_veiculo', ''),
                    modelo_veiculo=request.data.get('modelo_veiculo', ''),
                    cor_veiculo=request.data.get('cor_veiculo', ''),
                    estado_veiculo=request.data.get('estado_veiculo', ''),
                    foto_veiculo=request.FILES.get('foto_veiculo'),
                    # Documentação
                    carta_conducao=request.data.get('carta_conducao', ''),
                    validade_carta=request.data.get('validade_carta') or None,
                    documento_veiculo=request.FILES.get('documento_veiculo'),
                    # Status
                    status_aprovacao='PENDENTE',
                    is_verificado=False
                )
                
                return Response({
                    'detail': 'Cadastro enviado com sucesso! Aguarde a aprovação do administrador.',
                    'status_aprovacao': 'PENDENTE',
                    'mensagem': 'Você receberá um email quando seu cadastro for aprovado. Você pode verificar o status em /verificar-status',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': str(e),
                'detail': 'Erro ao cadastrar entregador'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Endpoint para ler e atualizar dados do usuário logado."""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """View customizada de login para retornar dados do usuário junto com o token."""
    serializer_class = CustomTokenObtainPairSerializer


class ListarClientesView(generics.ListAPIView):
    """Lista todos os clientes do sistema (global). Acessível por farmácias."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        # Apenas usuários logados que são FARMACIA ou ADMIN podem listar clientes
        if self.request.user.tipo_usuario in ['FARMACIA', 'ADMIN']:
            search = self.request.query_params.get('search', '')
            queryset = User.objects.filter(tipo_usuario='CLIENTE')
            if search:
                queryset = queryset.filter(
                    Q(first_name__icontains=search) | 
                    Q(last_name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(telefone__icontains=search)
                )
            return queryset
        return User.objects.none()

from django.db.models import Q
