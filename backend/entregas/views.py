from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .models import Entregador
from .serializers import EntregadorSerializer

User = get_user_model()


class VerificarStatusCadastroView(APIView):
    """Endpoint público para entregador verificar status do cadastro."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email é obrigatório'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email, tipo_usuario='ENTREGADOR')
            entregador = Entregador.objects.get(usuario=user)
            
            return Response({
                'nome': user.get_full_name(),
                'email': user.email,
                'telefone': user.telefone,
                'status_aprovacao': entregador.status_aprovacao,
                'motivo_rejeicao': entregador.motivo_rejeicao if entregador.status_aprovacao == 'REJEITADO' else None,
                'data_cadastro': user.data_criacao,
                'data_aprovacao': entregador.data_aprovacao,
                'tipo_veiculo': entregador.get_tipo_veiculo_display(),
                'mensagem': self._get_mensagem(entregador.status_aprovacao)
            })
            
        except User.DoesNotExist:
            return Response({
                'error': 'Nenhum cadastro de entregador encontrado com este email'
            }, status=status.HTTP_404_NOT_FOUND)
        except Entregador.DoesNotExist:
            return Response({
                'error': 'Cadastro incompleto. Entre em contato com o suporte.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def _get_mensagem(self, status_aprovacao):
        mensagens = {
            'PENDENTE': '⏳ Seu cadastro está em análise. Aguarde a aprovação do administrador.',
            'APROVADO': '✅ Parabéns! Seu cadastro foi aprovado. Você já pode fazer login e começar a trabalhar.',
            'REJEITADO': '❌ Seu cadastro foi rejeitado. Veja o motivo acima e faça um novo cadastro corrigindo as informações.'
        }
        return mensagens.get(status_aprovacao, 'Status desconhecido')
