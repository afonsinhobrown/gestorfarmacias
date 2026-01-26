from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Pedido
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
import random
import string

def gerar_codigo_alfanumerico(tamanho=6):
    """Gera um código curto tipo 'A7X-9B2' para quem não conseguir ler o QR."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=tamanho))

def gerar_imagem_qr(dados):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(dados)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue())

@receiver(post_save, sender=Pedido)
def gerar_seguranca_pedido(sender, instance, created, **kwargs):
    """
    Gera automaticamente os QR Codes de Fatura e Logística.
    """
    if created:
        # 1. QR Code da Fatura (Para TODOS os pedidos)
        # Dados para validação fiscal/consumidor
        dados_fatura = f"FATURA|PED:{instance.numero_pedido}|DATA:{instance.data_criacao}|VALOR:{instance.total}"
        instance.qrcode_fatura.save(f"qr_fatura_{instance.numero_pedido}.png", gerar_imagem_qr(dados_fatura), save=False)

        # Se for Venda Balcão, não precisa de QR Code de logística (Motoboy)
        if instance.endereco_entrega == "BALCÃO":
            instance.save()
            return

        # 2. Segurança da Coleta (Farmácia -> Motoboy)
        if not instance.codigo_coleta:
            codigo_coleta = gerar_codigo_alfanumerico()
            dados_coleta = f"COLETA-PEDIDO-{instance.numero_pedido}-COD-{codigo_coleta}"
            
            instance.codigo_coleta = codigo_coleta
            instance.qrcode_coleta.save(f"qr_coleta_{instance.numero_pedido}.png", gerar_imagem_qr(dados_coleta), save=False)
            
            # 3. Segurança da Entrega (Motoboy -> Cliente)
            codigo_entrega = gerar_codigo_alfanumerico()
            dados_entrega = f"ENTREGA-PEDIDO-{instance.numero_pedido}-COD-{codigo_entrega}"
            
            instance.codigo_entrega = codigo_entrega
            instance.qrcode_entrega.save(f"qr_entrega_{instance.numero_pedido}.png", gerar_imagem_qr(dados_entrega), save=False)
            
            instance.save()
