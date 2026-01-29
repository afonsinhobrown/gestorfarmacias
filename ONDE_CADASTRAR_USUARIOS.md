# 🎯 GUIA RÁPIDO - ONDE CADASTRAR USUÁRIOS

## 📍 LOCAIS DE CADASTRO

### 1️⃣ **CADASTRO DE FARMÁCIA (Primeira Vez)**

**Quando usar:** Quando você ainda não tem uma farmácia cadastrada

**Como acessar:**
1. Ir para: `http://localhost:3000/login`
2. Clicar em **"Farmácia"**
3. Clicar no botão verde **"Cadastrar Nova Farmácia"**
4. Ou acessar diretamente: `http://localhost:3000/register/farmacia`

**O que é criado:**
- ✅ Usuário (você, o dono)
- ✅ Farmácia
- ✅ Vinculação automática

---

### 2️⃣ **CADASTRO DE FUNCIONÁRIOS**

**Quando usar:** Depois de ter uma farmácia cadastrada e fazer login

**Como acessar:**
1. Fazer login como dono da farmácia
2. No menu lateral, clicar em **"Gestão de Usuários"**
3. Ou acessar diretamente: `http://localhost:3000/dashboard/usuarios`
4. Clicar em **"Novo Funcionário"**

**O que pode fazer:**
- ✅ Cadastrar funcionário (nome, cargo, salário)
- ✅ Criar acesso ao sistema (opcional)
- ✅ Editar dados
- ✅ Ativar/Desativar
- ✅ Remover funcionário

---

## 🔧 RESOLVER ERRO 500 NO RELATÓRIO

### **Problema:** "Request failed with status code 500"

### **Causas Possíveis:**

1. **Usuário não tem farmácia associada**
   - Executar: `python manage.py migrate_users`
   - Ou cadastrar nova farmácia em `/register/farmacia`

2. **Banco de dados não migrado**
   - Executar: `python manage.py migrate`

3. **Dados inconsistentes**
   - Verificar logs do backend
   - Executar script de migração

### **Solução Rápida:**

```bash
# No terminal do backend
cd backend
python manage.py migrate_users
```

Isso vai:
- ✅ Criar usuários para farmácias sem dono
- ✅ Associar pedidos órfãos
- ✅ Corrigir inconsistências

---

## 📊 MENU LATERAL ATUALIZADO

Agora o menu **"Gestão de Usuários"** aparece para:
- ✅ **ADMIN** (administradores)
- ✅ **FARMACIA** (donos de farmácia)

---

## 🎓 FLUXO COMPLETO

### **Para Novo Usuário:**

```
1. Acessar /login
   ↓
2. Clicar em "Farmácia"
   ↓
3. Clicar em "Cadastrar Nova Farmácia"
   ↓
4. Preencher dados do responsável (Passo 1)
   ↓
5. Preencher dados da farmácia (Passo 2)
   ↓
6. Fazer login com email e senha criados
   ↓
7. Acessar "Gestão de Usuários" no menu
   ↓
8. Cadastrar funcionários
```

### **Para Usuário Existente:**

```
1. Fazer login
   ↓
2. Menu lateral → "Gestão de Usuários"
   ↓
3. Clicar em "Novo Funcionário"
   ↓
4. Preencher dados
   ↓
5. Marcar "Criar acesso ao sistema" (se necessário)
   ↓
6. Salvar
```

---

## ⚠️ IMPORTANTE

### **Senhas Padrão (Após Migração):**
- Email: `{nuit}@farmacia.temp`
- Senha: `farmacia123`

**⚠️ ALTERE IMEDIATAMENTE!**

### **Funcionários com Acesso:**
- Email será usado como login
- Senha definida no cadastro
- Tipo de usuário: FARMACIA

---

## 🔗 LINKS DIRETOS

| Função | URL |
|--------|-----|
| Login | `http://localhost:3000/login` |
| Cadastro Farmácia | `http://localhost:3000/register/farmacia` |
| Gestão Usuários | `http://localhost:3000/dashboard/usuarios` |
| Relatório Comissões | `http://localhost:3000/dashboard/relatorios/comissoes` |
| POS (Vendas) | `http://localhost:3000/dashboard/vendas` |

---

## 📞 TROUBLESHOOTING

### **Erro: "Usuário não está associado a nenhuma farmácia"**
```bash
python manage.py migrate_users
```

### **Menu "Gestão de Usuários" não aparece**
- Verificar se está logado como FARMACIA ou ADMIN
- Fazer logout e login novamente

### **Não consigo criar funcionário**
- Verificar se tem farmácia associada
- Verificar permissões do usuário

---

**Última atualização:** 29/01/2026 10:35
**Status:** ✅ Funcionando
