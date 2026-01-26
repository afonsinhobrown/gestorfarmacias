from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer para o modelo de Usuário."""
    
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'password', 'first_name', 'last_name',
            'tipo_usuario', 'telefone', 'foto_perfil', 'foto_documento',
            'endereco', 'cidade', 'provincia', 'codigo_postal',
            'latitude', 'longitude'
        )
        read_only_fields = ('id', 'is_verificado', 'is_active', 'is_staff')
    
    def create(self, validated_data):
        """Cria e retorna um novo usuário com senha criptografada."""
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de usuário (sem senha)."""
    
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'telefone', 'foto_perfil',
            'endereco', 'cidade', 'provincia', 'codigo_postal',
            'latitude', 'longitude'
        )


class TokenPairSerializer(serializers.Serializer):
    """Serializer para resposta de token JWT."""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer(read_only=True)


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer customizado que aceita email em vez de username."""
    username_field = 'email'


class FarmaciaRegistroSerializer(serializers.ModelSerializer):
    """Serializer para registro de farmácias (cria User + Farmacia)."""
    
    password = serializers.CharField(write_only=True)
    farmacia_data = serializers.JSONField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'email', 'password', 'first_name', 'last_name',
            'telefone', 'farmacia_data'
        )
    
    def create(self, validated_data):
        """Cria usuário FARMACIA e objeto Farmacia vinculado."""
        from farmacias.models import Farmacia
        
        farmacia_data = validated_data.pop('farmacia_data')
        password = validated_data.pop('password')
        
        # Criar usuário
        validated_data['tipo_usuario'] = 'FARMACIA'
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # Criar farmácia vinculada
        Farmacia.objects.create(
            usuario=user,
            nome=farmacia_data.get('nome'),
            nuit=farmacia_data.get('nuit'),
            endereco=farmacia_data.get('endereco'),
            bairro=farmacia_data.get('bairro', ''),
            cidade=farmacia_data.get('cidade', 'Maputo'),
            latitude=farmacia_data.get('latitude'),
            longitude=farmacia_data.get('longitude'),
            is_ativa=False  # Aguarda aprovação do admin
        )
        
        return user
