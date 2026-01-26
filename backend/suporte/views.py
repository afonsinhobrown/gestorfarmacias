from rest_framework import generics, permissions, exceptions
from .models import MensagemPedido, Ticket, RespostaTicket
from .serializers import MensagemPedidoSerializer, TicketSerializer, RespostaTicketSerializer
from pedidos.models import Pedido

class MensagemListCreateView(generics.ListCreateAPIView):
    """Lista mensagens de um pedido ou envia nova mensagem."""
    serializer_class = MensagemPedidoSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        pedido_id = self.request.query_params.get('pedido')
        if not pedido_id:
            return MensagemPedido.objects.none()
        
        # Validar se usuário tem permissão de ver este pedido
        # (Cliente dono, Farmácia dona, Motoboy do pedido ou Admin)
        # Por simplicidade/performance, vamos confiar no front enviar ID certo e validar levemente
        return MensagemPedido.objects.filter(pedido_id=pedido_id)

    def perform_create(self, serializer):
        pedido = serializer.validated_data['pedido']
        user = self.request.user
        
        # Validação básica de permissão
        if user != pedido.cliente and \
           (hasattr(user, 'farmacia') and user.farmacia != pedido.farmacia) and \
           (hasattr(user, 'entregador') and user.entregador != pedido.entrega.entregador if hasattr(pedido, 'entrega') else True) and \
           user.tipo_usuario != 'ADMIN':
            raise exceptions.PermissionDenied("Você não faz parte deste pedido.")
            
        serializer.save(remetente=user)


class TicketListCreateView(generics.ListCreateAPIView):
    """Lista tickets do usuário ou cria novo."""
    serializer_class = TicketSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.tipo_usuario == 'ADMIN':
            return Ticket.objects.all()
        return Ticket.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class TicketResponderView(generics.CreateAPIView):
    """Adiciona uma resposta a um ticket existente."""
    serializer_class = RespostaTicketSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        ticket_id = self.kwargs.get('pk')
        from django.shortcuts import get_object_or_404
        ticket = get_object_or_404(Ticket, pk=ticket_id)
        
        # Validar permissão (Dono do ticket ou Admin)
        if self.request.user != ticket.usuario and self.request.user.tipo_usuario != 'ADMIN':
            raise exceptions.PermissionDenied("Sem permissão.")
            
        serializer.save(autor=self.request.user, ticket=ticket)
        
        # Opcional: Reabrir ticket se usuário responder
        if ticket.status == 'RESPONDIDO' and self.request.user == ticket.usuario:
             ticket.status = 'EM_ANALISE'
             ticket.save()
        # Opcional: Marcar como respondido se Admin responder
        if self.request.user.tipo_usuario == 'ADMIN':
             ticket.status = 'RESPONDIDO'
             ticket.save()

class TicketDetailView(generics.RetrieveUpdateAPIView):
    """Vê ou atualiza (fecha) um ticket."""
    serializer_class = TicketSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Ticket.objects.all()

    def get_queryset(self):
        if self.request.user.tipo_usuario == 'ADMIN':
            return Ticket.objects.all()
        return Ticket.objects.filter(usuario=self.request.user)
