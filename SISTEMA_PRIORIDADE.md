# 🎯 SISTEMA DE PRIORIDADE/VISIBILIDADE - IMPLEMENTAÇÃO COMPLETA

## 📋 Resumo do Sistema

Sistema de **prioridade paga** para Farmácias e Motoboys aparecerem em destaque para os clientes.

---

## ✅ O QUE JÁ FOI CRIADO

### 1. Backend - Modelos (`prioridade/models.py`)
- ✅ `PlanoPrioridade` - Planos disponíveis (7, 15, 30, 90 dias)
- ✅ `AssinaturaPrioridade` - Assinaturas ativas/pendentes
- ✅ `HistoricoPrioridade` - Auditoria de mudanças

### 2. Backend - Admin (`prioridade/admin.py`)
- ✅ Interface admin completa
- ✅ Aprovação/Rejeição de assinaturas
- ✅ Preview de comprovantes de pagamento
- ✅ Badges coloridos por status
- ✅ Ações em massa

### 3. Frontend - Modal Motoboy
- ✅ `AdicionarMotoboyModal.tsx` - Cadastro de motoboy próprio

---

## 🔧 PRÓXIMOS PASSOS (EM ORDEM)

### PASSO 1: Adicionar app ao Django

**Arquivo:** `backend/config/settings.py`

Adicionar em `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    # ... apps existentes ...
    'prioridade',  # ← ADICIONAR ESTA LINHA
]
```

### PASSO 2: Criar Migrations

```bash
cd backend
python manage.py makemigrations prioridade
python manage.py makemigrations entregas  # Para MotoboyCliente
python manage.py migrate
```

### PASSO 3: Criar Planos Iniciais (via Admin ou shell)

```python
python manage.py shell

from prioridade.models import PlanoPrioridade

# Planos para Farmácias
PlanoPrioridade.objects.create(
    nome="Destaque Semanal",
    tipo="FARMACIA",
    duracao_dias=7,
    preco=500.00,
    descricao="Apareça em destaque por 7 dias",
    ordem_prioridade=1
)

PlanoPrioridade.objects.create(
    nome="Destaque Mensal",
    tipo="FARMACIA",
    duracao_dias=30,
    preco=1500.00,
    descricao="Apareça em destaque por 30 dias",
    ordem_prioridade=1
)

# Planos para Motoboys
PlanoPrioridade.objects.create(
    nome="Destaque Semanal",
    tipo="MOTOBOY",
    duracao_dias=7,
    preco=300.00,
    descricao="Receba mais entregas por 7 dias",
    ordem_prioridade=1
)

PlanoPrioridade.objects.create(
    nome="Destaque Mensal",
    tipo="MOTOBOY",
    duracao_dias=30,
    preco=1000.00,
    descricao="Receba mais entregas por 30 dias",
    ordem_prioridade=1
)
```

### PASSO 4: Criar Serializers e Views

**Arquivo:** `backend/prioridade/serializers.py` (CRIAR)
**Arquivo:** `backend/prioridade/views.py` (CRIAR)
**Arquivo:** `backend/prioridade/urls.py` (CRIAR)

### PASSO 5: Atualizar Algoritmo de Busca

**Modificar:** `backend/produtos/views.py` - `BuscaGlobalView`

Ordenar resultados:
1. Farmácias com prioridade ativa
2. Farmácias aleatórias
3. Resto

### PASSO 6: Frontend - Tela "Aumentar Visibilidade"

**Criar:**
- `frontend-web/src/app/dashboard/farmacia/visibilidade/page.tsx`
- `frontend-web/src/app/motoboy/visibilidade/page.tsx`

### PASSO 7: Frontend - Badges "Recomendado"

**Modificar:** `frontend-web/src/app/busca/page.tsx`

Adicionar badge "⭐ Recomendado" nas farmácias com prioridade.

---

## 🎨 FLUXO COMPLETO

### Para Farmácia/Motoboy:
1. Acessa "Aumentar Visibilidade"
2. Escolhe plano (7, 15, 30 ou 90 dias)
3. Faz pagamento
4. Envia comprovativo
5. Status: PENDENTE

### Para Admin:
1. Acessa Admin Django
2. Vê assinaturas pendentes
3. Verifica comprovativo
4. Aprova ou Rejeita
5. Se aprovado → Status: ATIVA

### Para Cliente:
1. Busca medicamentos
2. Vê farmácias "⭐ Recomendadas" primeiro
3. Vê motoboys "⭐ Recomendados" primeiro
4. Pode escolher outros também

---

## 📊 MODELO DE NEGÓCIO

### Preços Sugeridos (Moçambique):

**Farmácias:**
- 7 dias: 500 MT
- 15 dias: 900 MT (10% desconto)
- 30 dias: 1.500 MT (20% desconto)
- 90 dias: 4.000 MT (30% desconto)

**Motoboys:**
- 7 dias: 300 MT
- 15 dias: 500 MT
- 30 dias: 1.000 MT
- 90 dias: 2.500 MT

---

## 🔐 SEGURANÇA

- ✅ Aprovação manual pelo admin
- ✅ Comprovativo obrigatório
- ✅ Histórico de todas as ações
- ✅ Expiração automática
- ✅ Auditoria completa

---

## 📱 PRÓXIMAS TELAS A CRIAR

1. **Dashboard Admin** - Gestão de assinaturas
2. **Tela Visibilidade** - Farmácia/Motoboy comprar plano
3. **Badge Recomendado** - Mostrar no frontend
4. **Algoritmo Ordenação** - Priorizar com assinatura ativa

---

## 🚀 COMANDOS RÁPIDOS

```bash
# 1. Adicionar app ao settings.py
# 2. Criar migrations
python manage.py makemigrations
python manage.py migrate

# 3. Criar superuser (se não tiver)
python manage.py createsuperuser

# 4. Acessar admin
http://localhost:8000/admin/prioridade/

# 5. Criar planos iniciais (via shell ou admin)
```

---

## ✨ BENEFÍCIOS DO SISTEMA

✅ **Receita recorrente** para a plataforma
✅ **Mais visibilidade** para farmácias/motoboys
✅ **Melhor experiência** para clientes (veem os melhores primeiro)
✅ **Transparente** (todos podem pagar para ter prioridade)
✅ **Justo** (aleatório entre os que não pagaram)

---

**QUER QUE EU CONTINUE IMPLEMENTANDO OS PRÓXIMOS PASSOS?** 🚀
