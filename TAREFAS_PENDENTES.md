# 📋 TAREFAS PENDENTES - PRIORIDADE MÁXIMA

## ✅ O QUE JÁ ESTÁ FUNCIONANDO
1. ✅ Checkout com pagamento (M-Pesa, Dinheiro, Transferência)
2. ✅ Tela POS/Vendas da farmácia
3. ✅ Dashboard do Cliente
4. ✅ Dashboard do Motoboy (existe em `/motoboy`)

---

## 🔴 TAREFAS URGENTES (FAZER AGORA)

### 1. COMPLETAR TELA POS - CADASTRO DE CLIENTE
**Arquivo:** `frontend-web/src/app/dashboard/vendas/page.tsx`

**O que fazer:**
- ✅ Import do CadastroClienteModal - FEITO
- ✅ Estado showCadastroCliente - FEITO
- ⏳ Adicionar campo "Cliente" com botão "Cadastrar Novo"
- ⏳ Adicionar modal no final da página

**Código a adicionar (linha ~240):**
```tsx
<div className="mb-4">
    <label className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1 block flex items-center justify-between">
        <span>Cliente (Opcional)</span>
        <button
            onClick={() => setShowCadastroCliente(true)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs normal-case"
        >
            <UserPlus size={14} />
            Cadastrar Novo
        </button>
    </label>
    <input
        type="text"
        value={cliente}
        onChange={e => setCliente(e.target.value)}
        placeholder="Nome ou NUIT do cliente"
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2 outline-none focus:border-blue-500"
    />
    <p className="text-xs text-gray-500 mt-1">Deixe em branco para "Consumidor Final"</p>
</div>
```

**Modal no final (antes do `</div>` final):**
```tsx
{showCadastroCliente && (
    <CadastroClienteModal
        onClose={() => setShowCadastroCliente(false)}
        onSuccess={(clienteNome) => {
            setCliente(clienteNome);
            setShowCadastroCliente(false);
            toast.success('Cliente cadastrado!');
        }}
    />
)}
```

---

### 2. DASHBOARD ADMIN COMPLETO
**Criar:** `frontend-web/src/app/dashboard/admin/page.tsx`

**Funcionalidades:**
- Estatísticas gerais (usuários, pedidos, receita)
- Lista de farmácias pendentes de aprovação
- Lista de motoboys pendentes
- Gestão de assinaturas de prioridade
- Relatórios financeiros

---

### 3. SISTEMA DE PRIORIDADE
**Status:** Modelos e Admin criados ✅

**Pendente:**
1. Adicionar `'prioridade'` ao INSTALLED_APPS
2. Criar migrations
3. Criar serializers e views
4. Criar tela "Aumentar Visibilidade" para farmácia/motoboy
5. Atualizar algoritmo de busca para priorizar

---

### 4. MELHORAR DASHBOARD MOTOBOY
**Arquivo:** `frontend-web/src/app/motoboy/page.tsx`

**Adicionar:**
- Botão "Aumentar Visibilidade" (comprar prioridade)
- Estatísticas de entregas
- Histórico de ganhos

---

## 📝 ORDEM DE EXECUÇÃO

1. **AGORA:** Completar POS com cadastro de cliente
2. **DEPOIS:** Criar Dashboard Admin
3. **DEPOIS:** Implementar sistema de prioridade completo
4. **DEPOIS:** Melhorar dashboard motoboy

---

## 🎯 FOCO ATUAL
**Completar tela POS com cadastro de cliente**
- É a funcionalidade mais importante para operação diária
- Farmácia precisa cadastrar clientes rapidamente no balcão
