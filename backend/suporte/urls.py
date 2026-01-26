from django.urls import path
from .views import MensagemListCreateView, TicketListCreateView, TicketResponderView, TicketDetailView

urlpatterns = [
    path('mensagens/', MensagemListCreateView.as_view(), name='mensagem_list_create'),
    path('tickets/', TicketListCreateView.as_view(), name='ticket_list_create'),
    path('tickets/<int:pk>/responder/', TicketResponderView.as_view(), name='ticket_responder'),
    path('tickets/<int:pk>/', TicketDetailView.as_view(), name='ticket_detail'),
]
