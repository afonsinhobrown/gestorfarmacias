from django.urls import path
from .views import ClienteListView, ClienteCreateView, ClienteDetailView

urlpatterns = [
    path('', ClienteListView.as_view(), name='cliente_list'),
    path('criar/', ClienteCreateView.as_view(), name='cliente_create'),
    path('<int:pk>/', ClienteDetailView.as_view(), name='cliente_detail'),
]
