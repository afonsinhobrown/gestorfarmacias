"""
Serviço e2Payments - DOCUMENTAÇÃO OFICIAL
https://e2payments.explicador.co.mz/docs/api
"""

import requests
from django.conf import settings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class E2PaymentsService:
    """Integração oficial e2Payments."""
    
    BASE_URL = "https://e2payments.explicador.co.mz"
    
    def __init__(self):
        self.client_id = settings.E2PAYMENTS_CLIENT_ID
        self.client_secret = settings.E2PAYMENTS_CLIENT_SECRET
    
    def _get_access_token(self):
        """Gera token OAuth2."""
        cached_token = cache.get('e2payments_token')
        if cached_token:
            return cached_token
        
        url = f"{self.BASE_URL}/oauth/token"  # SEM /v1/
        
        payload = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            token = f"{result['token_type']} {result['access_token']}"
            expires_in = result.get('expires_in', 31536000)
            
            cache.set('e2payments_token', token, expires_in - 60)
            return token
        
        except Exception as e:
            logger.error(f"Erro token: {e}")
            return None
    
    def _get_headers(self):
        """Headers padrão."""
        return {
            'Authorization': self._get_access_token(),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
    def c2b_mpesa_payment(self, wallet_id: str, amount: float, phone: str, reference: str):
        """
        Pagamento C2B M-Pesa.
        
        Args:
            wallet_id: ID da carteira M-Pesa
            amount: 1 a 1250000
            phone: 9 dígitos (sem +258)
            reference: Sem espaços
        """
        url = f"{self.BASE_URL}/v1/c2b/mpesa-payment/{wallet_id}"
        
        payload = {
            'client_id': self.client_id,  # OBRIGATÓRIO
            'amount': str(amount),
            'phone': phone,
            'reference': reference
        }
        
        try:
            logger.info(f"C2B M-Pesa: {payload}")
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Resposta: {result}")
            
            return {'success': True, 'data': result}
        
        except Exception as e:
            logger.error(f"Erro: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_all_payments(self):
        """Lista todos os pagamentos M-Pesa."""
        url = f"{self.BASE_URL}/v1/payments/mpesa/get/all"
        
        payload = {'client_id': self.client_id}
        
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Erro: {e}")
            return {'error': str(e)}
    
    def get_paginated_payments(self, limit: int = 10):
        """Lista pagamentos paginados."""
        url = f"{self.BASE_URL}/v1/payments/mpesa/get/all/paginate/{limit}"
        
        payload = {'client_id': self.client_id}
        
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def get_all_wallets(self):
        """Lista todas as carteiras."""
        url = f"{self.BASE_URL}/v1/wallets/mpesa/get/all"
        
        payload = {'client_id': self.client_id}
        
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def get_wallet_details(self, wallet_id: str):
        """Detalhes de uma carteira."""
        url = f"{self.BASE_URL}/v1/wallets/mpesa/get/{wallet_id}"
        
        payload = {'client_id': self.client_id}
        
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {'error': str(e)}


e2payments_service = E2PaymentsService()
