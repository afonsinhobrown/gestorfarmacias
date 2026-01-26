import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("--- Restaurando Senhas Padrão ---")

# Farmácias -> farmacia123
for u in User.objects.filter(tipo_usuario='FARMACIA'):
    u.set_password('farmacia123')
    u.save()
    print(f"[Restaurado] Farmácia {u.email} -> farmacia123")

# Entregadores -> entregador123
for u in User.objects.filter(tipo_usuario='ENTREGADOR'):
    u.set_password('entregador123')
    u.save()
    print(f"[Restaurado] Entregador {u.email} -> entregador123")

# Clientes -> cliente123
for u in User.objects.filter(tipo_usuario='CLIENTE'):
    u.set_password('cliente123')
    u.save()
    print(f"[Restaurado] Cliente {u.email} -> cliente123")

# Admins -> admin123
for u in User.objects.filter(tipo_usuario='ADMIN'):
    u.set_password('admin123')
    u.save()
    print(f"[Restaurado] Admin {u.email} -> admin123")

print("\nConcluído! Senhas restauradas.")
