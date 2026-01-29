from rest_framework import serializers
from .models import Funcionario, FolhaPagamento

class FuncionarioSerializer(serializers.ModelSerializer):
    cargo_display = serializers.CharField(source='get_cargo_display', read_only=True)
    criar_usuario = serializers.BooleanField(write_only=True, required=False, default=False)
    senha_usuario = serializers.CharField(write_only=True, required=False, allow_blank=True)
    usuario = serializers.SerializerMethodField()
    
    class Meta:
        model = Funcionario
        fields = '__all__'
        read_only_fields = ('farmacia',)
    
    def get_usuario(self, obj):
        if obj.usuario:
            return {
                'id': obj.usuario.id,
                'email': obj.usuario.email,
                'first_name': obj.usuario.first_name,
                'last_name': obj.usuario.last_name
            }
        return None

    def create(self, validated_data):
        from django.contrib.auth import get_user_model
        from django.db import transaction
        
        User = get_user_model()
        
        # Extrair campos extras
        criar_usuario = validated_data.pop('criar_usuario', False)
        senha_usuario = validated_data.pop('senha_usuario', None)
        
        request = self.context.get('request')
        if request and hasattr(request.user, 'farmacia'):
            validated_data['farmacia'] = request.user.farmacia
        
        with transaction.atomic():
            # Criar funcionário
            funcionario = super().create(validated_data)
            
            # Criar usuário se solicitado
            if criar_usuario and senha_usuario and funcionario.email:
                # Separar nome
                partes_nome = funcionario.nome.split(' ', 1)
                first_name = partes_nome[0]
                last_name = partes_nome[1] if len(partes_nome) > 1 else ''
                
                # Criar usuário
                user = User.objects.create_user(
                    email=funcionario.email,
                    password=senha_usuario,
                    first_name=first_name,
                    last_name=last_name,
                    telefone=funcionario.telefone,
                    tipo_usuario='FARMACIA'
                )
                
                # Vincular ao funcionário
                funcionario.usuario = user
                funcionario.save(update_fields=['usuario'])
            
            return funcionario

    def update(self, instance, validated_data):
        from django.contrib.auth import get_user_model
        from django.db import transaction
        User = get_user_model()

        criar_usuario = validated_data.pop('criar_usuario', False)
        senha_usuario = validated_data.pop('senha_usuario', None)

        with transaction.atomic():
            instance = super().update(instance, validated_data)

            # Criar usuário se solicitado e ainda não tiver
            if criar_usuario and senha_usuario and instance.email and not instance.usuario:
                partes_nome = instance.nome.split(' ', 1)
                first_name = partes_nome[0]
                last_name = partes_nome[1] if len(partes_nome) > 1 else ''
                
                user = User.objects.create_user(
                    email=instance.email,
                    password=senha_usuario,
                    first_name=first_name,
                    last_name=last_name,
                    telefone=instance.telefone,
                    tipo_usuario='FARMACIA'
                )
                
                instance.usuario = user
                instance.save(update_fields=['usuario'])
            
            return instance

class FolhaPagamentoSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)
    
    class Meta:
        model = FolhaPagamento
        fields = '__all__'
        read_only_fields = ('despesa_vinculada', 'total_liquido')
