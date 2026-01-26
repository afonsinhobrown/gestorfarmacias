from django.contrib.auth import get_user_model
from farmacias.models import Farmacia
from entregas.models import Entregador
from decimal import Decimal
from datetime import date

User = get_user_model()

def create_user(email, password, first_name, tipo):
    if not User.objects.filter(email=email).exists():
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            tipo_usuario=tipo,
            is_staff=(tipo == 'ADMIN'),
            is_superuser=(tipo == 'ADMIN')
        )
        print(f"Usuario criado: {email} ({tipo})")
        return user
    else:
        user = User.objects.get(email=email)
        user.set_password(password)
        user.tipo_usuario = tipo
        user.is_staff = (tipo == 'ADMIN')
        user.is_superuser = (tipo == 'ADMIN')
        user.save()
        print(f"Usuario atualizado: {email} ({tipo})")
        return user

# 1. ADMIN
create_user('admin@gestorfarma.com', 'admin123', 'Administrador', 'ADMIN')

# 2. FARMACIA
f_email = 'farmacia@gestorfarma.com'
f_user = create_user(f_email, 'farmacia123', 'Farmacia Central', 'FARMACIA')
nuit = '123456789'
Farmacia.objects.filter(nuit=nuit).exclude(usuario=f_user).delete()
Farmacia.objects.filter(usuario=f_user).delete()

Farmacia.objects.create(
    usuario=f_user,
    nome='Farmacia Central',
    nuit=nuit,
    telefone_principal='841234567',
    email='contato@farmaciacentral.co.mz',
    endereco='Av. Eduardo Mondlane, 123',
    bairro='Polana',
    cidade='Maputo',
    provincia='Maputo Cidade',
    latitude=Decimal('-25.967882'),
    longitude=Decimal('32.585547'),
    is_ativa=True
)

# 3. ENTREGADOR (Aprovado)
e_user = create_user('entregador@gestorfarma.com', 'entregador123', 'Joao Motoboy', 'ENTREGADOR')
doc_id = 'DOC-123456'
Entregador.objects.filter(documento_identidade=doc_id).exclude(usuario=e_user).delete()
Entregador.objects.filter(usuario=e_user).delete()

Entregador.objects.create(
    usuario=e_user,
    documento_identidade=doc_id,
    data_nascimento=date(1995, 5, 20),
    tipo_veiculo='MOTO',
    placa_veiculo='ABC-123-MP',
    status_aprovacao='APROVADO',
    is_verificado=True
)

# 4. CLIENTE
create_user('cliente@gestorfarma.com', 'cliente123', 'Maria Cliente', 'CLIENTE')

print("\n--- CREDENCIAIS PARA TESTE ---")
print("ADMIN: admin@gestorfarma.com / admin123")
print("FARMACIA: farmacia@gestorfarma.com / farmacia123")
print("ENTREGADOR: entregador@gestorfarma.com / entregador123")
print("CLIENTE: cliente@gestorfarma.com / cliente123")
