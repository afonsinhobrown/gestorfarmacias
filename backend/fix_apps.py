"""
Script para atualizar todos os apps.py com o atributo path
"""
from pathlib import Path

# Lista de todos os apps
apps = [
    'accounts', 'clientes', 'entregas', 'farmacias', 'financeiro',
    'fornecedores', 'pagamentos', 'pedidos', 'prioridade',
    'produtos', 'rh', 'suporte'
]

backend_dir = Path(__file__).parent

for app_name in apps:
    apps_file = backend_dir / app_name / 'apps.py'
    
    if apps_file.exists():
        # Ler conteúdo atual
        content = apps_file.read_text(encoding='utf-8')
        
        # Se já tem o path, pular
        if 'path = ' in content:
            print(f"✓ {app_name}/apps.py já tem o atributo path")
            continue
        
        # Se não tem o import Path, adicionar
        if 'from pathlib import Path' not in content:
            content = content.replace(
                'from django.apps import AppConfig',
                'from django.apps import AppConfig\nfrom pathlib import Path'
            )
        
        # Adicionar o atributo path antes do último \n
        lines = content.split('\n')
        new_lines = []
        for i, line in enumerate(lines):
            new_lines.append(line)
            # Se encontrar a linha com name = '...', adicionar path na próxima
            if "name = '" in line and i < len(lines) - 1:
                indent = ' ' * (len(line) - len(line.lstrip()))
                new_lines.append(f"{indent}path = str(Path(__file__).resolve().parent)")
        
        # Escrever de volta
        apps_file.write_text('\n'.join(new_lines), encoding='utf-8')
        print(f"✓ Atualizado {app_name}/apps.py")

print("\n✅ Todos os arquivos apps.py foram atualizados!")
