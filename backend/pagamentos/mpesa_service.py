"""
Serviço de integração com M-Pesa API
Documentação: https://developer.mpesa.vm.co.mz/
"""

import requests
import base64
import json
from django.conf import settings
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import logging

logger = logging.getLogger(__name__)


class MPesaService:
    """Serviço para integração com M-Pesa API da Vodacom Moçambique."""
    
    BASE_URL_SANDBOX = "https://api.sandbox.vm.co.mz:18352"
    BASE_URL_PRODUCTION = "https://api.vm.co.mz:18352"
    
    def __init__(self):
        self.api_key = settings.MPESA_API_KEY
        self.public_key = settings.MPESA_PUBLIC_KEY
        self.service_provider_code = settings.MPESA_SERVICE_PROVIDER_CODE
        self.initiator_identifier = settings.MPESA_INITIATOR_IDENTIFIER
        self.security_credential = self._encrypt_security_credential()
        self.base_url = self.BASE_URL_SANDBOX if settings.DEBUG else self.BASE_URL_PRODUCTION
    
    def _encrypt_security_credential(self):
        """Encripta a senha usando a chave pública fornecida pela Vodacom."""
        if not self.public_key or not settings.MPESA_SECURITY_PASSWORD:
            logger.info("M-Pesa: Credenciais não configuradas. Pulando encriptação.")
            return None
            
        try:
            public_key = RSA.importKey(base64.b64decode(self.public_key))
            cipher = PKCS1_v1_5.new(public_key)
            encrypted = cipher.encrypt(settings.MPESA_SECURITY_PASSWORD.encode())
            return base64.b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Erro ao encriptar credencial M-Pesa: {e}")
            return None
    
    def _get_headers(self):
        """Retorna headers padrão para requisições."""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}',
            'Origin': '*'
        }
    
    def c2b_payment(self, phone_number: str, amount: float, reference: str, transaction_id: str):
        """
        Inicia um pagamento C2B (Customer to Business).
        
        Args:
            phone_number: Número do cliente (formato: 258841234567)
            amount: Valor a cobrar
            reference: Referência do pedido
            transaction_id: ID único da transação
        
        Returns:
            dict: Resposta da API M-Pesa
        """
        # Formatar número de telefone (remover espaços, adicionar código do país)
        phone = phone_number.replace(' ', '').replace('+', '')
        if not phone.startswith('258'):
            phone = f'258{phone}'
        
        url = f"{self.base_url}/ipg/v1x/c2bPayment/singleStage/"
        
        payload = {
            "input_TransactionReference": transaction_id,
            "input_CustomerMSISDN": phone,
            "input_Amount": str(amount),
            "input_ThirdPartyReference": reference,
            "input_ServiceProviderCode": self.service_provider_code
        }
        
        try:
            logger.info(f"Iniciando pagamento M-Pesa: {payload}")
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Resposta M-Pesa: {result}")
            return {
                'success': True,
                'data': result,
                'conversation_id': result.get('output_ConversationID'),
                'transaction_id': result.get('output_TransactionID')
            }
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro na requisição M-Pesa: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def query_transaction_status(self, conversation_id: str, transaction_id: str):
        """
        Consulta o status de uma transação.
        
        Args:
            conversation_id: ID da conversa retornado pela API
            transaction_id: ID da transação
        
        Returns:
            dict: Status da transação
        """
        url = f"{self.base_url}/ipg/v1x/queryTransactionStatus/"
        
        payload = {
            "input_QueryReference": transaction_id,
            "input_ServiceProviderCode": self.service_provider_code,
            "input_ThirdPartyReference": conversation_id
        }
        
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao consultar status: {e}")
            return {'error': str(e)}
    
    def b2c_payment(self, phone_number: str, amount: float, reference: str):
        """
        Envia dinheiro para um cliente (Business to Customer).
        Útil para reembolsos ou pagamentos a motoboys.
        
        Args:
            phone_number: Número do destinatário
            amount: Valor a enviar
            reference: Referência da transação
        
        Returns:
            dict: Resposta da API
        """
        phone = phone_number.replace(' ', '').replace('+', '')
        if not phone.startswith('258'):
            phone = f'258{phone}'
        
        url = f"{self.base_url}/ipg/v1x/b2cPayment/"
        
        payload = {
            "input_TransactionReference": reference,
            "input_CustomerMSISDN": phone,
            "input_Amount": str(amount),
            "input_ThirdPartyReference": reference,
            "input_ServiceProviderCode": self.service_provider_code
        }
        
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro no pagamento B2C: {e}")
            return {'error': str(e)}


# Singleton instance
mpesa_service = MPesaService()
