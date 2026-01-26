import os
import django
import uuid
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from produtos.models import EstoqueProduto, ItemEntrada

print("--- INICIANDO PADRONIZAÇÃO DE LOTES ---")

# 1. Atualizar Estoque Atual (Visualização principal)
estoques = EstoqueProduto.objects.all()
count_estoque = 0

print("\n>> Atualizando Estoque Ativo...")
for est in estoques:
    # Gerar novo código único
    suffix = str(uuid.uuid4())[:4].upper()
    # Usar data de validade como referência se existir, ou hoje
    ref_date = timezone.now()
    data_str = ref_date.strftime('%y%m%d')
    
    novo_lote = f"L-{data_str}-{suffix}"
    lote_antigo = est.lote
    
    # Salvar
    est.lote = novo_lote
    est.save()
    
    print(f"   [{est.produto.nome}] Lote: {lote_antigo} -> {novo_lote}")
    count_estoque += 1

# 2. Atualizar Histórico de Entradas
print("\n>> Atualizando Histórico de Entradas...")
itens = ItemEntrada.objects.all()
count_itens = 0

for item in itens:
    # Apenas se não estiver no padrão (opcional, mas vou forçar todos para garantir)
    suffix = str(uuid.uuid4())[:4].upper()
    data_entrada = item.entrada.data_criacao if item.entrada else timezone.now()
    data_str = data_entrada.strftime('%y%m%d')
    
    novo_lote = f"L-{data_str}-{suffix}"
    item.lote = novo_lote
    item.save()
    count_itens += 1

print(f"\n--- CONCLUÍDO ---")
print(f"Estoques Atualizados: {count_estoque}")
print(f"Entradas Históricas Atualizadas: {count_itens}")
print("Agora todos os produtos seguem o padrão L-AAMMDD-XXXX.")
