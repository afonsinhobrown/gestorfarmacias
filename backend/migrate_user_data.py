"""
Script para migrar dados existentes e associar a um usuário padrão.
Execute com: python manage.py shell < migrate_user_data.py
"""

from django.contrib.auth import get_user_model
from farmacias.models import Farmacia
from pedidos.models import Pedido
from produtos.models import Produto, EstoqueProduto
from django.db import transaction

User = get_user_model()

def migrate_data():
    print("=" * 60)
    print("MIGRAÇÃO DE DADOS - Associação de Usuários")
    print("=" * 60)
    
    try:
        with transaction.atomic():
            # 1. Verificar se existe alguma farmácia
            farmacias = Farmacia.objects.all()
            
            if not farmacias.exists():
                print("\n❌ Nenhuma farmácia encontrada!")
                print("   Por favor, cadastre uma farmácia primeiro em /register/farmacia")
                return
            
            # 2. Para cada farmácia sem usuário, criar um usuário padrão
            farmacias_sem_usuario = Farmacia.objects.filter(usuario__isnull=True)
            
            if farmacias_sem_usuario.exists():
                print(f"\n📋 Encontradas {farmacias_sem_usuario.count()} farmácias sem usuário")
                
                for farmacia in farmacias_sem_usuario:
                    # Criar email baseado no NUIT ou nome
                    email_base = farmacia.nuit.replace(' ', '').lower() if farmacia.nuit else farmacia.nome.replace(' ', '').lower()
                    email = f"{email_base}@farmacia.temp"
                    
                    # Verificar se email já existe
                    counter = 1
                    original_email = email
                    while User.objects.filter(email=email).exists():
                        email = f"{original_email.split('@')[0]}{counter}@farmacia.temp"
                        counter += 1
                    
                    # Criar usuário
                    partes_nome = farmacia.nome.split(' ', 1)
                    user = User.objects.create_user(
                        email=email,
                        password='farmacia123',  # Senha padrão - DEVE SER ALTERADA!
                        first_name=partes_nome[0],
                        last_name=partes_nome[1] if len(partes_nome) > 1 else '',
                        telefone=farmacia.telefone_principal,
                        tipo_usuario='FARMACIA'
                    )
                    
                    # Associar à farmácia
                    farmacia.usuario = user
                    farmacia.save()
                    
                    print(f"   ✅ Farmácia '{farmacia.nome}' → Usuário criado: {email}")
                    print(f"      ⚠️  SENHA PADRÃO: farmacia123 (ALTERE IMEDIATAMENTE!)")
            
            # 3. Associar pedidos sem vendedor ao dono da farmácia
            pedidos_sem_vendedor = Pedido.objects.filter(vendedor__isnull=True)
            
            if pedidos_sem_vendedor.exists():
                print(f"\n📦 Encontrados {pedidos_sem_vendedor.count()} pedidos sem vendedor")
                
                for pedido in pedidos_sem_vendedor:
                    if pedido.farmacia and pedido.farmacia.usuario:
                        pedido.vendedor = pedido.farmacia.usuario
                        pedido.save(update_fields=['vendedor'])
                
                print(f"   ✅ {pedidos_sem_vendedor.count()} pedidos associados aos donos das farmácias")
            
            # 4. Resumo final
            print("\n" + "=" * 60)
            print("RESUMO DA MIGRAÇÃO")
            print("=" * 60)
            
            total_farmacias = Farmacia.objects.count()
            total_usuarios = User.objects.filter(tipo_usuario='FARMACIA').count()
            total_pedidos = Pedido.objects.count()
            pedidos_com_vendedor = Pedido.objects.filter(vendedor__isnull=False).count()
            
            print(f"\n📊 Estatísticas:")
            print(f"   • Farmácias cadastradas: {total_farmacias}")
            print(f"   • Usuários tipo FARMACIA: {total_usuarios}")
            print(f"   • Pedidos totais: {total_pedidos}")
            print(f"   • Pedidos com vendedor: {pedidos_com_vendedor}")
            
            if total_pedidos > pedidos_com_vendedor:
                print(f"\n   ⚠️  {total_pedidos - pedidos_com_vendedor} pedidos ainda sem vendedor")
                print(f"      (provavelmente de farmácias sem usuário associado)")
            
            print("\n✅ Migração concluída com sucesso!")
            print("\n⚠️  IMPORTANTE:")
            print("   1. Altere as senhas padrão imediatamente")
            print("   2. Configure os funcionários em /dashboard/usuarios")
            print("   3. Associe vendedores específicos aos novos pedidos")
            
    except Exception as e:
        print(f"\n❌ Erro durante a migração: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == '__main__':
    migrate_data()
