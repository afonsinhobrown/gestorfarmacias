import os
import django
from decimal import Decimal
from datetime import date

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from farmacias.models import Farmacia, Licenca
from entregas.models import Entregador

User = get_user_model()

def create_user(email, password, first_name, last_name, tipo):
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'tipo_usuario': tipo,
            'is_staff': (tipo == 'ADMIN'),
            'is_superuser': (tipo == 'ADMIN'),
            'is_active': True
        }
    )
    if not created:
        user.set_password(password)
        user.tipo_usuario = tipo
        user.is_staff = (tipo == 'ADMIN')
        user.is_superuser = (tipo == 'ADMIN')
        user.save()
    else:
        user.set_password(password)
        user.save()
    print(f"User {email} ({tipo}) - {'Created' if created else 'Updated'}")
    return user

def seed():
    print("--- SEEDING OFFICIAL TEST DATA ---")
    
    # 1. ADMIN
    create_user('admin@gestorfarma.com', 'admin123', 'Sistema', 'Admin', 'ADMIN')
    
    # 2. FARMACIA TESTE
    f_email = 'farmacia@gestorfarma.com'
    f_user = create_user(f_email, 'farmacia123', 'Gestor', 'Teste', 'FARMACIA')
    
    # Criar Farmacia se não existir
    # Removendo qualquer farmacia antiga com este NUIT para evitar conflito se o purge falhou em algo
    nuit_teste = '999999999'
    Farmacia.objects.filter(nuit=nuit_teste).exclude(usuario=f_user).delete()
    
    farmacia, created = Farmacia.objects.get_or_create(
        usuario=f_user,
        defaults={
            'nome': 'FARMACIA TESTE',
            'nuit': nuit_teste,
            'telefone_principal': '840000001',
            'email': f_email,
            'endereco': 'Av. Principal, 001',
            'bairro': 'Centro',
            'cidade': 'Maputo',
            'provincia': 'Maputo Cidade',
            'latitude': Decimal('-25.967882'),
            'longitude': Decimal('32.585547'),
            'is_ativa': True,
            'is_verificada': True
        }
    )
    if not created:
        farmacia.nome = 'FARMACIA TESTE'
        farmacia.is_ativa = True
        farmacia.save()
    print(f"Farmacia: {farmacia.nome} - {'Created' if created else 'Updated'}")
    
    # Garantir Licença Ativa
    Licenca.objects.get_or_create(
        farmacia=farmacia,
        is_ativa=True,
        defaults={
            'tipo': 'ANUAL',
            'data_inicio': date.today(),
            'data_fim': date(2030, 12, 31),
            'paga': True
        }
    )

    # 3. ENTREGADOR
    e_user = create_user('entregador@gestorfarma.com', 'entregador123', 'Joao', 'Entregador', 'ENTREGADOR')
    Entregador.objects.get_or_create(
        usuario=e_user,
        defaults={
            'documento_identidade': 'BI999999X',
            'data_nascimento': date(1990, 1, 1),
            'tipo_veiculo': 'MOTO',
            'placa_veiculo': 'MOCK-001',
            'status_aprovacao': 'APROVADO',
            'is_verificado': True
        }
    )
    print("Entregador profile linked.")

    # 4. CLIENTE
    create_user('cliente@gestorfarma.com', 'cliente123', 'Maria', 'Cliente', 'CLIENTE')

    print("--- SEEDING COMPLETE ---")

if __name__ == "__main__":
    seed()
