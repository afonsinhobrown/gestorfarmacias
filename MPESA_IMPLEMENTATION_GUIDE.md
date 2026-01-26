# 📱 Guia de Implementação M-Pesa

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Obter Credenciais](#obter-credenciais)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Testes](#testes)
6. [Produção](#produção)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

### Documentos Necessários
- ✅ NUIT da empresa
- ✅ Estatutos da empresa
- ✅ Identificação dos sócios/diretores
- ✅ Comprovativo de endereço comercial
- ✅ Conta bancária empresarial

### Requisitos Técnicos
- ✅ Python 3.8+
- ✅ Django 4.0+
- ✅ Servidor com HTTPS (para callbacks em produção)
- ✅ IP fixo ou domínio registado

---

## 🔑 Obter Credenciais

### Opção 1: Sandbox (Testes)

1. **Acesse o Portal de Desenvolvedor**
   ```
   https://developer.mpesa.vm.co.mz/
   ```

2. **Crie uma Conta**
   - Registe-se com email corporativo
   - Confirme o email

3. **Crie uma Aplicação**
   - Nome: GestorFarma
   - Tipo: C2B Payment
   - Callback URL: `https://seudominio.com/api/v1/pagamentos/mpesa/callback/`

4. **Copie as Credenciais**
   - API Key
   - Public Key
   - Service Provider Code (geralmente 171717 para sandbox)

### Opção 2: Produção (Comercial)

1. **Contacte a Vodacom**
   - Email: mpesabusiness@vm.co.mz
   - Telefone: +258 84 300 0000
   - WhatsApp Business: +258 84 300 0000

2. **Documentação Necessária**
   - Carta de solicitação em papel timbrado
   - NUIT
   - Estatutos
   - Identificação dos sócios
   - Comprovativo de endereço

3. **Processo**
   - Reunião comercial (2-3 dias)
   - Análise de documentos (5-7 dias)
   - Assinatura de contrato (1 dia)
   - Ativação de credenciais (1-2 dias)
   - **Total: ~2 semanas**

4. **Custos**
   - Taxa de ativação: ~5.000 MZN (varia)
   - Comissão por transação: 1.5% - 3%
   - Sem mensalidade

---

## 💻 Instalação

### 1. Instalar Dependências

```bash
cd backend
pip install pycryptodome requests
```

### 2. Adicionar ao requirements.txt

```txt
pycryptodome==3.19.0
requests==2.31.0
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp .env.mpesa.example .env
```

Edite `.env` e adicione suas credenciais:
```env
MPESA_API_KEY=sua_api_key_aqui
MPESA_PUBLIC_KEY=sua_public_key_base64_aqui
MPESA_SERVICE_PROVIDER_CODE=171717
MPESA_INITIATOR_IDENTIFIER=seu_initiator
MPESA_SECURITY_PASSWORD=sua_senha
MPESA_CALLBACK_URL=https://seudominio.com/api/v1/pagamentos/mpesa/callback/
```

### 2. Configurar Django Settings

Adicione em `config/settings.py`:

```python
# M-Pesa Configuration
MPESA_API_KEY = os.getenv('MPESA_API_KEY')
MPESA_PUBLIC_KEY = os.getenv('MPESA_PUBLIC_KEY')
MPESA_SERVICE_PROVIDER_CODE = os.getenv('MPESA_SERVICE_PROVIDER_CODE')
MPESA_INITIATOR_IDENTIFIER = os.getenv('MPESA_INITIATOR_IDENTIFIER')
MPESA_SECURITY_PASSWORD = os.getenv('MPESA_SECURITY_PASSWORD')
MPESA_CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL')
```

### 3. Adicionar URLs

Em `pagamentos/urls.py`:
```python
from .mpesa_views import (
    IniciarPagamentoMPesaView,
    MPesaCallbackView,
    ConsultarStatusPagamentoView
)

urlpatterns = [
    # ... outras rotas
    path('mpesa/iniciar/', IniciarPagamentoMPesaView.as_view()),
    path('mpesa/callback/', MPesaCallbackView.as_view()),
    path('mpesa/status/<int:pagamento_id>/', ConsultarStatusPagamentoView.as_view()),
]
```

---

## 🧪 Testes

### 1. Números de Teste (Sandbox)

A Vodacom fornece números de teste:
```
258841234567  # Sempre aprova
258842345678  # Sempre rejeita
258843456789  # Timeout
```

### 2. Testar Pagamento

```bash
curl -X POST http://localhost:8000/api/v1/pagamentos/mpesa/iniciar/ \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pedido_id": 1,
    "telefone": "841234567"
  }'
```

### 3. Simular Callback (Sandbox)

```bash
curl -X POST http://localhost:8000/api/v1/pagamentos/mpesa/callback/ \
  -H "Content-Type: application/json" \
  -d '{
    "output_ResponseCode": "INS-0",
    "output_ResponseDesc": "Request processed successfully",
    "output_TransactionID": "ABC123",
    "output_ConversationID": "XYZ789",
    "output_ThirdPartyReference": "Pedido-12345"
  }'
```

---

## 🚀 Produção

### 1. Configurar HTTPS

M-Pesa **exige HTTPS** para callbacks em produção.

**Opções:**
- Nginx + Let's Encrypt (grátis)
- Cloudflare (grátis)
- AWS Certificate Manager

### 2. Configurar Callback URL

No portal da Vodacom, configure:
```
https://api.gestorfarma.co.mz/api/v1/pagamentos/mpesa/callback/
```

### 3. Whitelist de IPs

A Vodacom pode exigir que você adicione os IPs deles ao firewall:
```
41.220.12.0/24
196.201.214.0/24
```

### 4. Monitoramento

Configure logs e alertas:
```python
# settings.py
LOGGING = {
    'loggers': {
        'pagamentos.mpesa_service': {
            'level': 'INFO',
            'handlers': ['file', 'mail_admins'],
        },
    },
}
```

---

## 🔧 Troubleshooting

### Erro: "Invalid API Key"
- ✅ Verifique se a API Key está correta
- ✅ Confirme se está usando sandbox/produção correto
- ✅ Regenere a chave no portal

### Erro: "Invalid Public Key"
- ✅ A chave deve estar em formato Base64
- ✅ Não deve ter quebras de linha
- ✅ Copie diretamente do portal

### Callback não está sendo recebido
- ✅ Verifique se a URL está acessível publicamente
- ✅ Teste com `curl` de fora do servidor
- ✅ Verifique logs do Nginx/Apache
- ✅ Confirme que CSRF está desabilitado para essa rota

### Pagamento fica "Pendente"
- ✅ Cliente pode ter cancelado no celular
- ✅ Saldo insuficiente
- ✅ Número de telefone inválido
- ✅ Consulte status via API

---

## 📞 Suporte

### Vodacom M-Pesa
- **Email:** mpesabusiness@vm.co.mz
- **Telefone:** +258 84 300 0000
- **Portal:** https://developer.mpesa.vm.co.mz/
- **Horário:** Segunda a Sexta, 8h-17h

### Documentação Oficial
- API Docs: https://developer.mpesa.vm.co.mz/docs
- Postman Collection: Disponível no portal

---

## ✅ Checklist de Go-Live

Antes de lançar em produção:

- [ ] Credenciais de produção obtidas
- [ ] HTTPS configurado e funcionando
- [ ] Callback URL testada e acessível
- [ ] Logs configurados
- [ ] Monitoramento ativo
- [ ] Testes com valores reais realizados
- [ ] Equipe treinada para suporte
- [ ] Processo de reembolso definido
- [ ] Termos de uso atualizados

---

## 💡 Dicas

1. **Sempre teste em sandbox primeiro**
2. **Guarde logs de todas as transações**
3. **Implemente retry logic para callbacks**
4. **Tenha um processo manual de reconciliação**
5. **Configure alertas para falhas**
6. **Mantenha backup das credenciais**

---

**Última atualização:** Janeiro 2026
**Versão da API M-Pesa:** v1x
