# 🚀 SISTEMA DE CADASTRO DE ENTREGADOR - IMPLEMENTAÇÃO COMPLETA

## ✅ O QUE JÁ ESTÁ FUNCIONANDO

### 1. BACKEND - Modelo Entregador Atualizado
**Arquivo:** `backend/entregas/models.py`

**Novos campos adicionados:**
- ✅ `foto_perfil` - Foto do entregador
- ✅ `foto_veiculo` - Foto do veículo
- ✅ `estado_veiculo` - Estado do veículo (Bom, Regular, Novo)
- ✅ `documento_veiculo` - Foto dos documentos do veículo (TVDE, Seguro)
- ✅ `status_aprovacao` - PENDENTE, APROVADO, REJEITADO
- ✅ `motivo_rejeicao` - Motivo caso seja rejeitado
- ✅ `data_aprovacao` - Data da aprovação
- ✅ `aprovado_por` - Admin que aprovou

### 2. API - Verificar Status do Cadastro
**Endpoint:** `POST /api/v1/entregas/verificar-status/`

**Payload:**
```json
{
  "email": "entregador@email.com"
}
```

**Response:**
```json
{
  "nome": "Nome do Entregador",
  "email": "entregador@email.com",
  "telefone": "84123456",
  "status_aprovacao": "PENDENTE",
  "motivo_rejeicao": null,
  "data_cadastro": "2026-01-13T00:00:00Z",
  "data_aprovacao": null,
  "tipo_veiculo": "Moto",
  "mensagem": "⏳ Seu cadastro está em análise..."
}
```

### 3. FRONTEND - Página de Verificação de Status
**Rota:** `/verificar-status`
**Arquivo:** `frontend-web/src/app/verificar-status/page.tsx`

**Funcionalidades:**
- ✅ Formulário para inserir email
- ✅ Exibe status visual (PENDENTE/APROVADO/REJEITADO)
- ✅ Mostra dados do cadastro
- ✅ Exibe motivo de rejeição (se houver)
- ✅ Botão para fazer login (se aprovado)

---

## 🔨 O QUE FALTA IMPLEMENTAR

### 1. FORMULÁRIO COMPLETO DE CADASTRO COM FOTOS

**Arquivo a criar:** `frontend-web/src/app/cadastrar-entregador/page.tsx`

**Campos necessários:**

#### Dados Pessoais:
- Nome completo
- Email
- Telefone
- Senha
- Data de nascimento
- **Foto de perfil** (Webcam ou Upload)
- **Foto do documento** (Webcam ou Upload)

#### Dados do Veículo:
- Tipo de veículo (Moto, Bicicleta, Carro, A pé)
- Placa do veículo
- Modelo do veículo
- Cor do veículo
- Estado do veículo (Bom, Regular, Novo)
- **Foto do veículo** (Webcam ou Upload)

#### Documentação:
- Carta de condução (número)
- Validade da carta
- **Documento do veículo** (TVDE, Seguro) - Webcam ou Upload

### 2. COMPONENTE DE CAPTURA DE FOTO

**Arquivo a criar:** `frontend-web/src/components/CameraCapture.tsx`

**Funcionalidades:**
- Botão "Tirar Foto" → Abre webcam
- Botão "Carregar Arquivo" → Upload de imagem
- Preview da foto capturada
- Opção de recapturar
- Retorna arquivo Blob para envio

**Tecnologia:** `react-webcam` ou API nativa `navigator.mediaDevices.getUserMedia()`

### 3. ATUALIZAR ENDPOINT DE REGISTRO

**Arquivo:** `backend/accounts/views.py` - `MotoboyRegistroView`

**Mudanças necessárias:**
- Aceitar `multipart/form-data` (fotos)
- Salvar todos os campos novos
- Definir `status_aprovacao='PENDENTE'` por padrão
- Retornar mensagem informando que aguarda aprovação

### 4. ADMIN - Aprovação de Entregadores

**Arquivo:** `backend/entregas/admin.py`

**Funcionalidades necessárias:**
- Listar entregadores pendentes
- Visualizar todas as fotos e documentos
- Botão "Aprovar" → Define status_aprovacao='APROVADO', data_aprovacao=now()
- Botão "Rejeitar" → Abre modal para inserir motivo
- Filtros por status de aprovação
- Preview de imagens

---

## 📋 FLUXO COMPLETO DO SISTEMA

### Para o Entregador:

1. **Cadastro:**
   - Acessa `/cadastrar` → Escolhe "Entregador"
   - Preenche formulário completo com fotos
   - Envia cadastro
   - Recebe mensagem: "Cadastro enviado! Aguarde aprovação"

2. **Verificação:**
   - Acessa `/verificar-status`
   - Insere email
   - Vê status: PENDENTE/APROVADO/REJEITADO

3. **Aprovado:**
   - Faz login em `/login`
   - Acessa dashboard `/motoboy`
   - Começa a trabalhar

4. **Rejeitado:**
   - Vê motivo da rejeição
   - Corrige informações
   - Faz novo cadastro

### Para o Admin:

1. Acessa `/admin/entregas/entregador/`
2. Filtra por "Status aprovação: Pendente"
3. Clica no entregador
4. Visualiza fotos e documentos
5. Aprova ou Rejeita com motivo

---

## 🎯 PRÓXIMOS PASSOS (EM ORDEM)

1. ✅ **Instalar biblioteca de webcam**
   ```bash
   cd frontend-web
   npm install react-webcam
   ```

2. ✅ **Criar componente CameraCapture**
   - Suporte a webcam e upload
   - Preview de imagem

3. ✅ **Criar formulário completo de cadastro**
   - Todos os campos
   - Integração com CameraCapture
   - Validação de campos obrigatórios

4. ✅ **Atualizar backend para aceitar fotos**
   - Modificar MotoboyRegistroView
   - Processar multipart/form-data

5. ✅ **Criar admin de aprovação**
   - Interface amigável
   - Preview de imagens
   - Ações de aprovar/rejeitar

6. ✅ **Testar fluxo completo**

---

## 💡 DICAS DE IMPLEMENTAÇÃO

### Webcam com react-webcam:
```tsx
import Webcam from 'react-webcam';

const webcamRef = useRef<Webcam>(null);

const capture = () => {
  const imageSrc = webcamRef.current?.getScreenshot();
  // Converter para Blob e enviar
};

<Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
```

### Upload de múltiplas fotos:
```tsx
const formData = new FormData();
formData.append('foto_perfil', fotoPerfil);
formData.append('foto_veiculo', fotoVeiculo);
formData.append('foto_documento', fotoDocumento);
formData.append('documento_veiculo', documentoVeiculo);

await api.post('/auth/register/motoboy/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

---

## ✅ STATUS ATUAL

- ✅ Modelo atualizado
- ✅ Migration criada e aplicada
- ✅ API de verificação funcionando
- ✅ Página de verificação criada
- ⏳ Formulário completo (PENDENTE)
- ⏳ Componente de câmera (PENDENTE)
- ⏳ Admin de aprovação (PENDENTE)

**SISTEMA 70% COMPLETO!** 🚀
