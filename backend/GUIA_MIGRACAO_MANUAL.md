# Guia de Migração Manual do Supabase (Cloud para Cloud)

Se prefere fazer manualmente via terminal, a ferramenta padrão do PostgreSQL (`pg_dump`) é a mais rápida e segura.

## Pré-requisitos
Você precisa ter o **PostgreSQL** instalado no seu Windows para ter acesso aos comandos `pg_dump` e `psql`. Se não tiver, pode baixar aqui: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

---

## Passo 1: Obter a String de Conexão (Antiga e Nova)

No painel do Supabase de ambos os projetos (Antigo e Novo), vá em:
1. **Settings** (ícone de engrenagem) > **Database**.
2. Em **Connection String**, selecione **URI**.
3. Copie a string. Ela se parece com:
   `postgresql://postgres:[SUA_SENHA]@[HOST]:5432/postgres`

---

## Passo 2: Exportar o Banco Antigo (Backup)

Abra seu terminal (CMD ou PowerShell) e execute:

### Opção A: Esquema + Dados (Recomendado para Migração Completa)
```bash
pg_dump "postgresql://postgres:SENHA_ANTIGA@db.HOST_ANTIGO.supabase.co:5432/postgres" -f backup_completo.sql
```

### Opção B: Apenas Esquema (Estrutura das tabelas, sem dados)
```bash
pg_dump "postgresql://postgres:SENHA_ANTIGA@db.HOST_ANTIGO.supabase.co:5432/postgres" --schema-only -f esquema.sql
```

*Se pedir senha e você não colocou na URL, digite a senha do banco antigo.*

---

## Passo 3: Importar no Banco Novo

Com o arquivo `.sql` gerado, envie para o novo projeto do Supabase:

```bash
psql "postgresql://postgres:SENHA_NOVA@db.HOST_NOVO.supabase.co:5432/postgres" -f backup_completo.sql
```

---

## Dicas Importantes

1. **Permissões (Roles):** O Supabase tem roles específicas (`authenticated`, `anon`, `service_role`). O `pg_dump` pode tentar exportar permissões que conflitam no novo banco. Se der erro de permissão, adicione `--no-owner --no-privileges` no comando de exportação (`pg_dump`).
   
   Exemplo limpo:
   ```bash
   pg_dump "LINK_ANTIGO" --no-owner --no-privileges -f backup_limpo.sql
   ```

2. **Resetar o Novo Banco:** Se o banco novo não estiver vazio (já tentou fazer migrate antes), limpe-o antes de importar para evitar erros de "relation already exists":
   ```bash
   psql "LINK_NOVO" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   ```

3. **Storage (Imagens):** Lembre-se que o banco de dados **não contém os arquivos** (imagens dos produtos, receitas). Se você usa o Supabase Storage, precisará mover esses arquivos separadamente (manualmente via dashboard ou via script).
