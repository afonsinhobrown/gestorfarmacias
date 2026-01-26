import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from financeiro.models import CategoriaDespesa

categorias = [
    ('Salários e Ordenados', 'Pagamentos de funcionários e colaboradores'),
    ('Água e Esgoto', 'Faturas mensais de fornecimento de água'),
    ('Energia Elétrica / EDM', 'Faturas de luz e energia (Credelec/Pós-pago)'),
    ('Internet e Comunicação', 'Recargas, mensalidades de internet e telefone'),
    ('Arrendamento / Aluguel', 'Custo do espaço físico da farmácia'),
    ('Lixo Hospitalar / Tóxico', 'Serviço de recolha de medicamentos vencidos e lixo biológico'),
    ('Limpeza e Higiene', 'Produtos de limpeza, álcool, papel higiénico'),
    ('Insumos de Balcão e Papelaria', 'Rolos térmicos, sacolas, papelaria, toners'),
    ('Manutenção e Reparos', 'Ar condicionado, lâmpadas, pintura, pequenos reparos'),
    ('Segurança e Vigilância', 'Empresas de segurança ou guarda noturno'),
    ('Taxas e Licenças', 'Alvarás, taxas municipais, quotas da ordem'),
    ('Combustível e Transporte', 'Combustível para entregas e deslocações'),
    ('Marketing e Publicidade', 'Panfletos, rádio, redes sociais'),
    ('Impostos e Taxas Bancárias', 'Taxas de POS, transferências e impostos'),
    ('Outras Despesas', 'Despesas diversas não categorizadas'),
]

print("Criando categorias padrão...")
for nome, desc in categorias:
    cat, created = CategoriaDespesa.objects.get_or_create(
        nome=nome,
        farmacia=None, # None significa que é Global/Padrão para todas
        defaults={'descricao': desc}
    )
    if created:
        print(f"[+] Criada: {nome}")
    else:
        print(f"[.] Já existe: {nome}")

print("Concluído!")
