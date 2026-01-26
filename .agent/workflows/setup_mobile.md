---
description: Configuração do Backend para Desenvolvimento Mobile (Flutter)
---

Para que o aplicativo móvel (Android/iOS) consiga acessar o backend no seu computador, o Django deve rodar ouvindo todos os IPs da rede.

1. **Servidor Django:**
   Execute o servidor com o comando abaixo para permitir conexões externas:
   ```powershell
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Endereço IP:**
   O aplicativo Flutter está configurado para usar o seu IP local: `192.168.100.3`.
   
3. **Rede:**
   Certifique-se de que o seu telefone (ou tablet) e o computador estejam na **mesma rede Wi-Fi**.

4. **Execução:**
   Para rodar o app no dispositivo real ou simulador:
   ```powershell
   cd mobile
   flutter run
   ```
