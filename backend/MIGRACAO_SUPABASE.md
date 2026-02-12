# Guia de Migração para Novo Projeto Supabase

Este guia ajuda a configurar o backend para usar uma nova base de dados Supabase, caso a anterior tenha atingido o limite.

## Passo 1: Criar Novo Projeto no Supabase

1. Aceda a [supabase.com](https://supabase.com/) e faça login na sua **nova conta** (ou na mesma, se criar um novo projeto).
2. Clique em **"New Project"**.
3. Escolha a Organização, Nome do Projeto (ex: `GestorFarmacias_Novo`), e uma **Password forte** para a base de dados (guarde-a bem!).
4. Escolha a região mais próxima (ex: Frankfurt ou Londres).
5. Clique em **"Create new project"**.
6. Aguarde alguns minutos até o projeto estar pronto.

## Passo 2: Obter Credenciais de Conexão

1. No dashboard do novo projeto, vá a **Project Settings** (ícone de engrenagem) -> **Database**.
2. Em **Connection parameters**, anote:
    - **Host**: (ex: `db.lqj...supabase.co`)
    - **Database**: `postgres` (normalmente)
    - **Port**: `5432` or `6543` (use 5432 para conexão direta)
    - **User**: `postgres`
    - **Password**: (a que definiu no passo 1)

## Passo 3: Atualizar o Backend

1. Abra o ficheiro `.env` na pasta `backend`.
2. Altere as configurações de base de dados para:

```ini
DB_ENGINE=django.db.backends.postgresql
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[SUA_SENHA_DO_PASSO_1]
DB_HOST=[SEU_HOST_DO_PASSO_2]
DB_PORT=5432
```

## Passo 4: Migrar a Estrutura (Tabelas)

No terminal, dentro da pasta `backend`, execute:

```bash
python manage.py migrate
```

Isso criará todas as tabelas vazias na nova base de dados.

## Passo 5: Migrar os Dados (Backup e Restore)

Se você precisa mover os dados da conta antiga para a nova:

### Opção A: Usando comandos Django (Mais simples, mas mais lento)

1. **Na configuração da base ANTIGA** (reverta o .env se necessário), exporte os dados:
   ```bash
   python manage.py dumpdata --exclude auth.permission --exclude contenttypes --indent 2 > backup_dados.json
   ```

2. **Na configuração da base NOVA** (com o .env atualizado), importe os dados:
   ```bash
   python manage.py loaddata backup_dados.json
   ```

### Opção B: Usando Supabase CLI ou PGAdmin (Recomendado para muitos dados)

1. Faça um backup full da base antiga via interface do Supabase ou `pg_dump`.
2. Restaure na nova base usando `psql` ou a interface.

---
**Nota:** Se tiver problemas com o `loaddata` devido a chaves estrangeiras ou integridade, a Opção B é preferível.
