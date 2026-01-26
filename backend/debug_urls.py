import os
import django
from django.conf import settings
from django.urls import URLPattern, URLResolver

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def list_urls(lis, acc=None):
    if acc is None:
        acc = []
    if not lis:
        return
    l = lis[0]
    if isinstance(l, URLPattern):
        yield acc + [str(l.pattern)]
    elif isinstance(l, URLResolver):
        yield from list_urls(l.url_patterns, acc + [str(l.pattern)])
    yield from list_urls(lis[1:], acc)

from config.urls import urlpatterns

print("Listando TODAS as URLs carregadas pelo Django:")
print("="*60)
for p in list_urls(urlpatterns):
    url_path = ''.join(p)
    if 'produtos' in url_path:
        print(f"--> ENCONTRADA: {url_path}")
    else:
        print(f"    {url_path}")
print("="*60)
