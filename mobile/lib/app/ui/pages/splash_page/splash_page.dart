import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/services/config_service.dart';
import '../../../routes/app_pages.dart';

class SplashPage extends StatefulWidget {
  @override
  _SplashPageState createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  final ConfigService _config = Get.find<ConfigService>();
  bool _showPicker = false;

  @override
  void initState() {
    super.initState();
    _startApp();
  }

  void _startApp() async {
    // Aguarda um pouco para mostrar a logo
    await Future.delayed(Duration(seconds: 2));
    
    // Se não tivermos o picker forçado, seguimos para o Login/Home
    if (!_showPicker) {
      Get.offAllNamed(Routes.LOGIN);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blue[800],
      body: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.local_pharmacy, size: 100, color: Colors.white),
                SizedBox(height: 16),
                Text(
                  'GestorFarma',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                CircularProgressIndicator(color: Colors.white),
              ],
            ),
          ),
          
          // Botão discreto para abrir configurações de IP
          PositionError(context),
        ],
      ),
    );
  }

  Widget PositionError(BuildContext context) {
    return Positioned(
      bottom: 40,
      left: 0,
      right: 0,
      child: Center(
        child: TextButton.icon(
          onPressed: () => _showEnvironmentPicker(),
          icon: Icon(Icons.settings, color: Colors.white70),
          label: Text(
            'Configurar Ambiente',
            style: TextStyle(color: Colors.white70),
          ),
        ),
      ),
    );
  }

  void _showEnvironmentPicker() {
    Get.bottomSheet(
      Container(
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Escolha o Ambiente',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            ListTile(
              leading: Icon(Icons.computer, color: Colors.blue),
              title: Text('Windows (Localhost)'),
              subtitle: Text('http://localhost:8000'),
              onTap: () {
                _config.updateBaseUrl('http://localhost:8000/api/v1');
                Get.back();
                Get.offAllNamed(Routes.LOGIN);
              },
            ),
            ListTile(
              leading: Icon(Icons.phone_android, color: Colors.green),
              title: Text('Meu Telefone (USB/Wi-Fi)'),
              subtitle: Text('IP: 192.168.100.3'),
              onTap: () {
                _config.updateBaseUrl('http://192.168.100.3:8000/api/v1');
                Get.back();
                Get.offAllNamed(Routes.LOGIN);
              },
            ),
            ListTile(
              leading: Icon(Icons.edit, color: Colors.orange),
              title: Text('Outro IP (Manual)'),
              onTap: () => _showManualIpEntry(),
            ),
          ],
        ),
      ),
    );
  }

  void _showManualIpEntry() {
    final controller = TextEditingController(text: _config.baseUrl.value.replaceAll('http://', '').replaceAll('/api/v1', ''));
    Get.defaultDialog(
      title: 'IP Manual',
      content: TextField(
        controller: controller,
        decoration: InputDecoration(hintText: 'Ex: 192.168.1.10:8000'),
      ),
      textConfirm: 'SALVAR',
      onConfirm: () {
        _config.updateBaseUrl(controller.text);
        Get.back(); // Fecha dialog
        Get.back(); // Fecha bottomsheet
        Get.offAllNamed(Routes.LOGIN);
      },
    );
  }
}
