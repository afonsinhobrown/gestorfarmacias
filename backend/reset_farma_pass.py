import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("--- Usuários Cadastrados ---")
for u in User.objects.filter(tipo_usuario='FARMACIA'):
    print(f"ID: {u.id} | Email: {u.email} | Nome: {u.first_name}")
    # Resetar senha para facilitar (comprando briga com segurança por usabilidade agora)
    u.set_password('123456')
    u.save()
    print(f"-> Senha redefinida para: 123456")

print("\nConcluído. Tente login com a senha '123456'.")
