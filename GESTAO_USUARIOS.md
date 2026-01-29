# 📚 DOCUMENTAÇÃO COMPLETA - GESTÃO DE USUÁRIOS E PERMISSÕES

## 🎯 Visão Geral

O sistema agora possui **gestão completa de usuários** com diferentes níveis de acesso e permissões. Cada farmácia tem um **dono** (usuário principal) e pode ter múltiplos **funcionários** com acesso ao sistema.

---

## 👥 Tipos de Usuários

### 1. **ADMIN** (Administrador do Sistema)
- **Acesso:** Painel administrativo completo
- **Permissões:** Gerenciar todas as farmácias, aprovar cadastros, visualizar estatísticas globais
- **Login:** admin@gestorfarma.com / admin123

### 2. **FARMACIA** (Dono da Farmácia)
- **Acesso:** Dashboard completo da farmácia
- **Permissões:** 
  - Gerenciar produtos e estoque
  - Realizar vendas
  - Visualizar relatórios financeiros
  - Gerenciar funcionários
  - Configurar farmácia
- **Criação:** Via `/register/farmacia`

### 3. **FARMACIA** (Funcionário)
- **Acesso:** Dashboard da farmácia (limitado conforme cargo)
- **Permissões:** Definidas pelo dono
- **Criação:** Pelo dono em `/dashboard/usuarios`

### 4. **CLIENTE**
- **Acesso:** Área do cliente
- **Permissões:** Fazer pedidos, acompanhar entregas
- **Criação:** Via `/cadastrar`

### 5. **ENTREGADOR**
- **Acesso:** App de entregas
- **Permissões:** Visualizar e gerenciar entregas
- **Criação:** Via `/register/motoboy`

---

## 🏥 Fluxo de Cadastro de Farmácia

### Passo 1: Acessar Tela de Registro
1. Ir para `/login`
2. Selecionar "Farmácia"
3. Clicar em **"Cadastrar Nova Farmácia"**

### Passo 2: Dados do Responsável
- Nome e Sobrenome
- Email (será o login)
- Telefone
- Senha (mínimo 6 caracteres)

### Passo 3: Dados da Farmácia
- Nome da Farmácia *
- NUIT * (deve ser único)
- Alvará
- Telefones
- Endereço completo *
- Cidade e Província

### Passo 4: Confirmação
- Sistema cria:
  - ✅ Usuário (dono)
  - ✅ Farmácia
  - ✅ Vinculação automática
- Farmácia fica **ativa imediatamente**

---

## 👨‍💼 Gestão de Funcionários

### Acessar Gestão
**Rota:** `/dashboard/usuarios`

### Cadastrar Novo Funcionário

1. **Clicar em "Novo Funcionário"**

2. **Preencher Dados Básicos:**
   - Nome Completo *
   - Cargo * (Farmacêutico, Atendente, Caixa, Gerente, etc.)
   - Salário Base *
   - Telefone *
   - Email
   - Data de Admissão *

3. **Criar Acesso ao Sistema (Opcional):**
   - ☑️ Marcar "Criar acesso ao sistema para este funcionário"
   - Definir senha de acesso
   - Email será usado como login

4. **Salvar**

### Funcionalidades Disponíveis

#### ✅ Listar Funcionários
- Visualizar todos os funcionários
- Buscar por nome, email ou telefone
- Ver status (Ativo/Inativo)
- Identificar quem tem acesso ao sistema

#### ✅ Editar Funcionário
- Atualizar dados cadastrais
- Alterar cargo e salário
- **Nota:** Não é possível criar acesso ao sistema na edição (apenas no cadastro)

#### ✅ Ativar/Desativar
- Clicar no badge de status
- Funcionários inativos não aparecem em relatórios de comissão

#### ✅ Remover Funcionário
- Confirmação obrigatória
- **Atenção:** Dados de vendas anteriores são mantidos

---

## 🔐 Sistema de Permissões

### Hierarquia de Acesso

```
ADMIN (Nível 5)
  └─ Acesso total ao sistema
  
FARMACIA - Dono (Nível 4)
  └─ Acesso completo à sua farmácia
     ├─ Gerenciar funcionários
     ├─ Visualizar todos os relatórios
     ├─ Configurar farmácia
     └─ Realizar todas as operações
  
FARMACIA - Funcionário (Nível 3)
  └─ Acesso limitado conforme cargo
     ├─ Farmacêutico: Vendas + Estoque
     ├─ Atendente: Vendas
     ├─ Caixa: Vendas + Financeiro
     └─ Gerente: Quase tudo (exceto config)
  
CLIENTE (Nível 2)
  └─ Área do cliente
  
ENTREGADOR (Nível 1)
  └─ App de entregas
```

### Regras de Negócio

1. **Vendas:**
   - Todas as vendas são associadas ao usuário logado
   - Comissões calculadas automaticamente

2. **Relatórios:**
   - Dono vê todos os vendedores
   - Funcionário vê apenas suas próprias vendas

3. **Estoque:**
   - Movimentações registram o usuário responsável

4. **Funcionários:**
   - Apenas o dono pode gerenciar funcionários
   - Funcionários não podem criar outros funcionários

---

## 🔄 Migração de Dados Existentes

### Comando de Migração

```bash
python manage.py migrate_users
```

### O que o comando faz:

1. **Identifica farmácias sem usuário**
   - Cria usuário automático
   - Email: `{nuit}@farmacia.temp`
   - Senha: `farmacia123`

2. **Associa pedidos órfãos**
   - Pedidos sem vendedor → Dono da farmácia

3. **Gera relatório completo**
   - Estatísticas de migração
   - Avisos importantes

### ⚠️ IMPORTANTE Após Migração

1. **Alterar senhas padrão imediatamente**
   - Ir em Configurações → Alterar Senha
   
2. **Cadastrar funcionários reais**
   - Ir em `/dashboard/usuarios`
   - Criar funcionários com dados corretos

3. **Revisar vendas antigas**
   - Verificar se vendedores estão corretos
   - Ajustar comissões se necessário

---

## 📊 Comissões e Vendas

### Como Funciona

1. **Cadastro de Produto:**
   - Define `percentual_comissao` (ex: 2.5%)

2. **Venda no POS:**
   - Sistema calcula automaticamente:
     ```
     valor_comissao = preco_unitario × quantidade × (percentual_comissao / 100)
     ```

3. **Relatório de Comissões:**
   - Acesso: `/dashboard/relatorios/comissoes`
   - Filtra por período
   - Mostra por vendedor
   - Calcula total geral

### Exemplo Prático

**Produto:** Paracetamol 500mg
- Preço: 30.00 MT
- Comissão: 2.5%

**Venda:**
- Quantidade: 10 unidades
- Subtotal: 300.00 MT
- Comissão: 7.50 MT

**Vendedor:** João Silva
- Total de vendas no mês: 15,000.00 MT
- Total de comissões: 375.00 MT

---

## 🛠️ Troubleshooting

### Problema: "Usuário não está associado a nenhuma farmácia"

**Solução:**
1. Executar `python manage.py migrate_users`
2. Ou cadastrar nova farmácia em `/register/farmacia`

### Problema: Funcionário não consegue fazer login

**Verificar:**
1. Email está correto?
2. Funcionário tem usuário criado?
3. Funcionário está ativo?
4. Senha está correta?

### Problema: Relatório de comissões vazio

**Verificar:**
1. Produtos têm `percentual_comissao` definido?
2. Vendas têm vendedor associado?
3. Filtro de data está correto?

### Problema: Erro 500 ao acessar relatórios

**Solução:**
1. Verificar se usuário tem farmácia associada
2. Executar migração de dados
3. Verificar logs do backend

---

## 📝 Checklist de Implantação

### Para o Cliente

- [ ] Executar `python manage.py migrate_users`
- [ ] Alterar senhas padrão
- [ ] Cadastrar funcionários reais
- [ ] Definir comissões nos produtos
- [ ] Testar fluxo de venda completo
- [ ] Verificar relatórios de comissão
- [ ] Treinar equipe no novo sistema

### Para Novos Usuários

- [ ] Cadastrar farmácia em `/register/farmacia`
- [ ] Fazer login
- [ ] Cadastrar produtos
- [ ] Cadastrar funcionários
- [ ] Definir comissões
- [ ] Realizar primeira venda
- [ ] Verificar relatórios

---

## 🎓 Treinamento da Equipe

### Para o Dono da Farmácia

1. **Gestão de Funcionários**
   - Como cadastrar
   - Como dar acesso ao sistema
   - Como ativar/desativar

2. **Configuração de Comissões**
   - Definir percentuais por produto
   - Acompanhar performance

3. **Relatórios**
   - Comissões por vendedor
   - Vendas por período
   - Performance da equipe

### Para Funcionários

1. **Login no Sistema**
   - Usar email e senha fornecidos
   - Alterar senha no primeiro acesso

2. **Realizar Vendas**
   - Buscar produtos
   - Adicionar ao carrinho
   - Finalizar venda

3. **Visualizar Comissões**
   - Acessar relatórios
   - Ver suas vendas
   - Acompanhar ganhos

---

## 🔗 Links Importantes

- **Login:** `/login`
- **Cadastro de Farmácia:** `/register/farmacia`
- **Gestão de Usuários:** `/dashboard/usuarios`
- **Relatório de Comissões:** `/dashboard/relatorios/comissoes`
- **POS (Vendas):** `/dashboard/vendas`
- **Produtos:** `/dashboard/produtos`

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verificar esta documentação
2. Consultar logs do sistema
3. Contatar suporte técnico

---

**Última atualização:** 29/01/2026
**Versão:** 2.0.0
