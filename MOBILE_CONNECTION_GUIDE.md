# Guia de Resolução de Problemas de Conexão - Mobile

Se você estiver enfrentando erros de conexão (Network Error, Fetch Failed) no aplicativo móvel Expo, siga este guia.

## 1. Verificar IPs
Certifique-se de que o arquivo `mobile-app/src/services/api.js` está apontando para o IP correto da sua máquina.
- Abra o terminal e digite `ipconfig`
- Procure por "IPv4 Address" (ex: 192.168.100.7)
- Verifique se a constante `API_URL` no arquivo `api.js` corresponde a este IP.

## 2. Firewall do Windows
O Firewall do Windows pode bloquear conexões de entrada na porta 8000.
- Pressione `Win + R`, digite `wf.msc` e Enter.
- Em "Regras de Entrada" (Inbound Rules), verifique se há uma regra permitindo a porta 8000 ou o executável `python.exe`.
- Se não houver, crie uma "Nova Regra" -> "Porta" -> "TCP" -> "Portas específicas: 8000" -> "Permitir a conexão" -> Marque todas as redes (Domínio, Privado, Público) -> Nomeie como "Django Backend".

## 3. Servidor Django
O servidor deve ser iniciado com `0.0.0.0` para aceitar conexões externas.
- Executar: `python manage.py runserver 0.0.0.0:8000`
- Confirme se aparece: `Starting development server at http://0.0.0.0:8000/`

## 4. Resetar Expo
Às vezes o Expo cacheia configurações antigas.
- Pressione `Ctrl + C` para parar o Expo.
- Rode: `npx expo start --clear`

## 5. Teste de Conexão
Use o navegador do celular para testar antes do App.
- Abra o Chrome/Safari no celular.
- Digite: `http://192.168.100.7:8000/admin`
- Se carregar a tela de login do Django, a conexão está perfeita. Se ficar carregando infinitamente, é problema de Firewall ou Rede (passos 1 e 2).
