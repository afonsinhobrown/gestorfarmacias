from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .models import Farmacia
from .serializers import FarmaciaListSerializer
from produtos.models import Produto, EstoqueProduto
from produtos.serializers import ProdutoSerializer

class ClientFarmaciaListView(APIView):
    """Lista todas as farmácias ativas para clientes."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        farmacias = Farmacia.objects.filter(is_ativa=True)
        # Usar um serializer simples ou manual para evitar overhead
        data = []
        for f in farmacias:
            data.append({
                'id': f.id,
                'nome': f.nome,
                'logo': f.logo.url if f.logo else None,
                'endereco': f.endereco,
                'bairro': f.bairro,
                'cidade': f.cidade,
                'nota': float(f.nota_media),
                'telefone': f.telefone_principal,
                'aceita_entregas': f.aceita_entregas,
                'taxa_entrega': float(f.taxa_entrega)
            })
        return Response(data)

class ClientFarmaciaProdutosView(APIView):
    """Lista produtos disponíveis em uma farmácia específica."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, farmacia_id):
        # Buscar apenas produtos que tenham estoque > 0 nesta farmácia
        estoques = EstoqueProduto.objects.filter(
            farmacia_id=farmacia_id, 
            quantidade__gt=0
        ).select_related('produto')
        
        data = []
        for e in estoques:
            data.append({
                'id': e.produto.id,
                'estoque_id': e.id,
                'nome': e.produto.nome,
                'categoria': e.produto.categoria.nome if e.produto.categoria else None,
                'preco': float(e.preco_venda),
                'imagem': e.produto.imagem_principal.url if e.produto.imagem_principal else None,
                'descricao': e.produto.descricao,
                'requer_receita': e.produto.requer_receita,
                'disponivel': e.quantidade
            })
        return Response(data)
