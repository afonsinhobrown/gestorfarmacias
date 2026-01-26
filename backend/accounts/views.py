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
                # Preparar dados do usuário
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
                    'tipo_usuario': 'FARMACIA'
                }
                
                # Validar se email já existe
                if User.objects.filter(email=user_data['email']).exists():
                    return Response({'error': 'Email já cadastrado'}, status=status.HTTP_400_BAD_REQUEST)
                
                user = User.objects.create_user(**user_data)
                
                # Criar farmácia
                Farmacia.objects.create(
                    usuario=user,
                    nome=request.data.get('nome') or first_name, # Nome da farmácia pode ser o nome do user se não vier
                    nuit=request.data.get('nuit', ''),
                    endereco=request.data.get('endereco', ''),
                    bairro=request.data.get('bairro', ''),
                    cidade=request.data.get('cidade', 'Maputo'),
                    is_ativa=False # Aguarda ativação admin
                )
                
                return Response({
                    'detail': 'Farmácia cadastrada com sucesso! Aguarde a aprovação do administrador.',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                user = User.objects.get(email=request.data['email'])
                user_serializer = UserSerializer(user)
                response.data['user'] = user_serializer.data
            except Exception:
                pass # Caso o email não venha no request ou usuário não encontrado
        return response


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
