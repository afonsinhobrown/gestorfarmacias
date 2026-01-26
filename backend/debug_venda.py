import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from pedidos.serializers import VendaBalcaoSerializer
from django.contrib.auth import get_user_model
from produtos.models import EstoqueProduto
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

User = get_user_model()

def testar_venda():
    print("Iniciando debug de venda balcão...")
    try:
        # 1. Pegar usuario farmacia
        user = User.objects.get(email='farmacia@teste.com') # Ajuste se o email for outro
        print(f"Usuario encontrado: {user}")

        # 2. Pegar um produto com estoque
        estoque = EstoqueProduto.objects.filter(farmacia=user.farmacia, quantidade__gt=0).first()
        if not estoque:
            print("ERRO: Nenhum produto com estoque encontrado para teste!")
            return

        print(f"Produto encontrado: {estoque.produto.nome} (Qtd: {estoque.quantidade})")

        # 3. Simular Payload
        payload = {
            "cliente": "Cliente Debug",
            "tipo_pagamento": "DINHEIRO",
            "itens": [
                {
                    "estoque_id": estoque.id,
                    "quantidade": 1,
                    "preco_unitario": str(estoque.preco_venda)
                }
            ]
        }
        
        # 4. Simular Request
        factory = APIRequestFactory()
        request = factory.post('/api/v1/pedidos/venda-balcao/', payload, format='json')
        request.user = user

        # 5. Serializer
        serializer = VendaBalcaoSerializer(data=payload, context={'request': request})
        if serializer.is_valid():
            print("Serializer válido. Tentando salvar...")
            pedido = serializer.save()
            print(f"SUCESSO! Pedido criado: #{pedido.numero_pedido}")
        else:
            print(f"ERRO DE VALIDAÇÃO: {serializer.errors}")

    except Exception as e:
        print("\n\n!!! ERRO CAPTURADO !!!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    testar_venda()
