# 📘 Manual de Uso: GestorFarma ERP & Marketplace

Este guia detalha como operar a plataforma em todos os seus níveis: **Administrativo**, **Farmácia**, **Motoboy** e **Cliente**.

---

## 🔑 Credenciais de Teste (Padrão)
*Todos os usuários de teste usam a senha:* `123`

| Perfil | Email | Senha | Função Principal |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@teste.com` | `123` | Gere a plataforma, comissões e parcerias. |
| **Dona da Farmácia**| `farmacia@teste.com`| `123` | Gere estoque, vendas balcão (POS) e entregas. |
| **Motoboy** | `motoboy@teste.com` | `123` | Recebe pedidos e faz entregas via App. |
| **Cliente** | `cliente@teste.com` | `123` | Compra medicamentos via App. |

---

## 🚀 Como Iniciar o Sistema

### 1. Backend (O "Cérebro")
No terminal da pasta `backend`:
1. Ative o ambiente virtual: `.\venv\Scripts\Activate.ps1`
2. Rode o servidor: `python manage.py runserver`
*Deve estar sempre rodando para o Web e Mobile funcionarem.*

### 2. Painel Web (Para Admin e Farmácia)
No terminal da pasta `frontend-web`:
1. Rode o comando: `npm run dev`
*Acesse em: `http://localhost:3000`*

### 3. Aplicativo Mobile (Para Cliente e Motoboy)
Como você não tem telemóvel físico/emulador, use um destes comandos na pasta `mobile`:
*   **No Browser:** `flutter run -d chrome`
*   **No Windows:** `flutter run -d windows`

---

## 🛠️ Guia de Operação por Perfil

### **A. Administrador (Gestão SaaS)**
1.  **Aprovação:** Vá em **Farmácias** ou **Motoboys**. Verifique os documentos e clique em **Aprovar**. Somente após isso eles podem vender ou entregar.
2.  **Monitoria:** No dashboard principal, acompanhe a **Receita Líquida (Comissões)** de 10% gerada sobre as vendas das farmácias.
3.  **Suporte:** Responda a **Tickets** de usuários com problemas técnicos.

### **B. Dona da Farmácia (Operação ERP)**
1.  **Ponto de Venda (POS):** Para clientes que entram na loja, use a aba **Ponto de Venda**. Bipe/busque o produto, escolha a forma de pagamento (M-Pesa, Cash, POS) e imprima o recibo.
2.  **Estoque Inteligente:** No menu **Produtos**, controle os **Lotes** e **Validades**. O sistema avisará quando um lote estiver próximo do vencimento.
3.  **Financeiro:** Acompanhe o faturamento diário e mensal na aba **Financeiro**.

### **C. Logística de Segurança (QR Code Duplo)**
Este é o diferencial da sua plataforma:
1.  **Na Coleta (Farmácia):** A farmácia mostra o **QR Code de Coleta** para o Motoboy escanear. Isso confirma que o motoboy certo pegou o pedido certo.
2.  **Na Entrega (Cliente):** O Cliente mostra o seu **QR Code de Entrega** (ou o código numérico) para o Motoboy finalizar a entrega no App.

### **D. Suporte e Chat**
*   Dentro de cada pedido, existe um **Chat em tempo real**.
*   A Farmácia pode avisar o cliente se um produto está em falta ou se o motoboy já saiu.
*   Os **Tickets** servem para problemas formais que requerem intervenção do Administrador da plataforma.
