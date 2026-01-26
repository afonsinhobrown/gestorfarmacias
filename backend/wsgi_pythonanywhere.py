import os
import sys

# Adicione o caminho do seu projeto
path = '/home/afonsinhobrown/gestorfarmacias/backend'
if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
