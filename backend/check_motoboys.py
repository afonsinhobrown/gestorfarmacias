import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from entregas.models import Entregador

User = get_user_model()

# Buscar usuários motoboy/entregador
users = User.objects.filter(email__icontains='motoboy')
print(f"\n{'='*60}")
print(f"USUÁRIOS COM 'MOTOBOY' NO EMAIL: {users.count()}")
print(f"{'='*60}")

for u in users:
    print(f"\n📧 Email: {u.email}")
    print(f"👤 Nome: {u.get_full_name()}")
    print(f"📱 Telefone: {u.telefone}")
    print(f"🏷️  Tipo: {u.tipo_usuario}")
    print(f"✅ Ativo: {u.is_active}")
    
    # Verificar se tem registro de Entregador
    try:
        entregador = Entregador.objects.get(usuario=u)
        print(f"🏍️  Veículo: {entregador.tipo_veiculo}")
        print(f"📄 Documento: {entregador.documento_identidade}")
        print(f"✔️  Verificado: {entregador.is_verificado}")
    except Entregador.DoesNotExist:
        print(f"❌ SEM REGISTRO DE ENTREGADOR!")

print(f"\n{'='*60}")
print(f"TOTAL DE ENTREGADORES NO SISTEMA: {Entregador.objects.count()}")
print(f"{'='*60}\n")
