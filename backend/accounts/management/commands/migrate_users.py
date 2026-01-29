from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from farmacias.models import Farmacia
from pedidos.models import Pedido
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Migra dados existentes e associa a usuários'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("MIGRAÇÃO DE DADOS - Associação de Usuários")
        self.stdout.write("=" * 60)
        
        try:
            with transaction.atomic():
                # 1. Verificar se existe alguma farmácia
                farmacias = Farmacia.objects.all()
                
                if not farmacias.exists():
                    self.stdout.write(self.style.ERROR("\n❌ Nenhuma farmácia encontrada!"))
                    self.stdout.write("   Por favor, cadastre uma farmácia primeiro em /register/farmacia")
                    return
                
                # 2. Para cada farmácia sem usuário, criar um usuário padrão
                farmacias_sem_usuario = Farmacia.objects.filter(usuario__isnull=True)
                
                if farmacias_sem_usuario.exists():
                    self.stdout.write(f"\n📋 Encontradas {farmacias_sem_usuario.count()} farmácias sem usuário")
                    
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
                        
                        self.stdout.write(self.style.SUCCESS(f"   ✅ Farmácia '{farmacia.nome}' → Usuário criado: {email}"))

                # 2.5 Garantir que os Donos de Farmácia tenham registro de Funcionário (para aparecer na lista)
                from rh.models import Funcionario
                from django.utils import timezone
                
                farmacias_todas = Farmacia.objects.all()
                for farmacia in farmacias_todas:
                    if farmacia.usuario and not Funcionario.objects.filter(usuario=farmacia.usuario).exists():
                        Funcionario.objects.create(
                            nome=farmacia.usuario.get_full_name() or farmacia.nome,
                            usuario=farmacia.usuario,
                            farmacia=farmacia,
                            cargo=Funcionario.Cargo.GERENTE,
                            salario_base=0,  # Dono não tem salário fixo por padrão aqui
                            data_admissao=farmacia.data_criacao.date() if farmacia.data_criacao else timezone.now().date(),
                            telefone=farmacia.usuario.telefone or farmacia.telefone_principal,
                            email=farmacia.usuario.email,
                            ativo=True
                        )
                        self.stdout.write(self.style.SUCCESS(f"   ✅ Perfil de Gerente criado para o dono: {farmacia.usuario.email}"))
                
                # 3. Associar pedidos sem vendedor ao dono da farmácia
                pedidos_sem_vendedor = Pedido.objects.filter(vendedor__isnull=True)
                
                if pedidos_sem_vendedor.exists():
                    self.stdout.write(f"\n📦 Encontrados {pedidos_sem_vendedor.count()} pedidos sem vendedor")
                    
                    for pedido in pedidos_sem_vendedor:
                        if pedido.farmacia and pedido.farmacia.usuario:
                            pedido.vendedor = pedido.farmacia.usuario
                            pedido.save(update_fields=['vendedor'])
                    
                    self.stdout.write(self.style.SUCCESS(f"   ✅ {pedidos_sem_vendedor.count()} pedidos associados aos donos das farmácias"))
                
                # 4. Resumo final
                self.stdout.write("\n" + "=" * 60)
                self.stdout.write("RESUMO DA MIGRAÇÃO")
                self.stdout.write("=" * 60)
                
                total_farmacias = Farmacia.objects.count()
                total_usuarios = User.objects.filter(tipo_usuario='FARMACIA').count()
                total_pedidos = Pedido.objects.count()
                pedidos_com_vendedor = Pedido.objects.filter(vendedor__isnull=False).count()
                
                self.stdout.write(f"\n📊 Estatísticas:")
                self.stdout.write(f"   • Farmácias cadastradas: {total_farmacias}")
                self.stdout.write(f"   • Usuários tipo FARMACIA: {total_usuarios}")
                self.stdout.write(f"   • Pedidos totais: {total_pedidos}")
                self.stdout.write(f"   • Pedidos com vendedor: {pedidos_com_vendedor}")
                
                if total_pedidos > pedidos_com_vendedor:
                    self.stdout.write(self.style.WARNING(f"\n   ⚠️  {total_pedidos - pedidos_com_vendedor} pedidos ainda sem vendedor"))
                    self.stdout.write("      (provavelmente de farmácias sem usuário associado)")
                
                self.stdout.write(self.style.SUCCESS("\n✅ Migração concluída com sucesso!"))
                self.stdout.write(self.style.WARNING("\n⚠️  IMPORTANTE:"))
                self.stdout.write("   1. Altere as senhas padrão imediatamente")
                self.stdout.write("   2. Configure os funcionários em /dashboard/usuarios")
                self.stdout.write("   3. Associe vendedores específicos aos novos pedidos")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ Erro durante a migração: {str(e)}"))
            import traceback
            traceback.print_exc()
            raise
