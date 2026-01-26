import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:dio/dio.dart';
import '../../../data/services/config_service.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/providers/api_provider.dart';
import '../../../routes/app_pages.dart';

class SettingsPage extends StatefulWidget {
  @override
  _SettingsPageState createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final ConfigService _config = Get.find();
  final AuthService _auth = Get.find();
  final ApiProvider _api = ApiProvider();
  
  final TextEditingController _ipController = TextEditingController();
  final TextEditingController _ivaController = TextEditingController();
  
  bool isSavingIva = false;
  Map<String, dynamic>? farmaciaData;

  @override
  void initState() {
    super.initState();
    // Extrai apenas o IP do baseUrl atual
    String currentUrl = _config.baseUrl.value;
    if (currentUrl.contains('://')) {
      String afterProtocol = currentUrl.split('://')[1];
      String ip = afterProtocol.split(':')[0];
      _ipController.text = ip;
    }
    _loadFarmaciaData();
  }

  Future<void> _loadFarmaciaData() async {
    try {
      final res = await _api.get('farmacias/me/');
      if (res.statusCode == 200) {
        setState(() {
          farmaciaData = res.data;
          _ivaController.text = (res.data['percentual_iva'] ?? '16.00').toString();
        });
      }
    } catch (e) {
      print('Erro ao carregar dados da farmácia: $e');
    }
  }

  Future<void> _saveIvaConfig() async {
    final iva = double.tryParse(_ivaController.text);
    if (iva == null) {
      Get.snackbar('Erro', 'Insira um valor de IVA válido');
      return;
    }

    setState(() => isSavingIva = true);
    try {
      final res = await _api.patch('farmacias/me/', data: {
        'percentual_iva': iva
      });
      if (res.statusCode == 200) {
        Get.snackbar('Sucesso', 'Configuração fiscal atualizada!', backgroundColor: Colors.green[100]);
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha ao salvar configuração fiscal');
    } finally {
      setState(() => isSavingIva = false);
    }
  }

  void _saveConfig() {
    String ip = _ipController.text.trim();
    if (ip.isEmpty) {
      Get.snackbar('Erro', 'Por favor, insira um endereço IP válido');
      return;
    }
    
    String newUrl = 'http://$ip:8000/api/v1/';
    _config.updateBaseUrl(newUrl);
    
    Get.snackbar(
      'Sucesso', 
      'Servidor configurado! Teste a conexão antes de fazer login.',
      backgroundColor: Colors.green[100],
      duration: Duration(seconds: 4)
    );
  }

  void _resetToDefault() {
    _config.resetToDefault();
    String currentUrl = _config.baseUrl.value;
    if (currentUrl.contains('://')) {
      String afterProtocol = currentUrl.split('://')[1];
      String ip = afterProtocol.split(':')[0];
      _ipController.text = ip;
    }
    Get.snackbar('Info', 'Configuração restaurada para o padrão');
  }

  Future<void> _testConnection() async {
    String ip = _ipController.text.trim();
    if (ip.isEmpty) {
      Get.snackbar('Erro', 'Digite um IP primeiro');
      return;
    }

    Get.dialog(
      Center(child: CircularProgressIndicator()),
      barrierDismissible: false,
    );

    try {
      final testUrl = 'http://$ip:8000/api/v1/';
      final dio = Dio();
      dio.options.baseUrl = testUrl;
      dio.options.connectTimeout = Duration(seconds: 5);
      
      final response = await dio.get('auth/login/'); 
      
      Get.back(); 
      
      if (response.statusCode == 405 || response.statusCode == 200 || response.statusCode == 400) {
        Get.snackbar(
          'Sucesso! ✅',
          'Servidor encontrado em $testUrl\nVocê pode fazer login agora!',
          backgroundColor: Colors.green[100],
          duration: Duration(seconds: 5),
        );
      } else {
        Get.snackbar('Aviso', 'Servidor respondeu, mas com status ${response.statusCode}');
      }
    } catch (e) {
      Get.back(); 
      Get.snackbar(
        'Erro de Conexão ❌',
        'Não foi possível conectar ao servidor.\n\nVerifique:\n1. O IP está correto?\n2. O servidor está rodando?\n3. Você está na mesma rede Wi-Fi?',
        backgroundColor: Colors.red[100],
        duration: Duration(seconds: 6),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Configurações', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.blue[900],
        iconTheme: IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Seção: Fiscal (NOVA)
            _buildSectionHeader('Configurações Fiscais'),
            SizedBox(height: 15),
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Taxa de IVA Padrão (%)',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey[700]),
                  ),
                  SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _ivaController,
                          decoration: InputDecoration(
                            hintText: 'Ex: 16.00',
                            suffixText: '%',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            filled: true,
                            fillColor: Colors.grey[50],
                          ),
                          keyboardType: TextInputType.numberWithOptions(decimal: true),
                        ),
                      ),
                      SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: isSavingIva ? null : _saveIvaConfig,
                        child: isSavingIva ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Icon(Icons.check, color: Colors.white),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green[700],
                          minimumSize: Size(50, 55),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 5),
                  Text('Esta taxa será aplicada nos cálculos de relatórios e faturas.', style: TextStyle(fontSize: 10, color: Colors.grey)),
                ],
              ),
            ),
            
            SizedBox(height: 30),

            // Seção: Conexão com Servidor
            _buildSectionHeader('Conexão Local (Rede)'),
            SizedBox(height: 15),
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Endereço IP do Servidor',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey[700]),
                  ),
                  SizedBox(height: 10),
                  TextField(
                    controller: _ipController,
                    decoration: InputDecoration(
                      hintText: 'Ex: 192.168.100.3',
                      prefixIcon: Icon(Icons.dns, color: Colors.blue[800]),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      filled: true,
                      fillColor: Colors.grey[50],
                    ),
                    keyboardType: TextInputType.numberWithOptions(decimal: true),
                  ),
                  SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _saveConfig,
                          icon: Icon(Icons.save, color: Colors.white),
                          label: Text('SALVAR IP', style: TextStyle(color: Colors.white)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue[900],
                            minimumSize: Size(double.infinity, 50),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _resetToDefault,
                        child: Icon(Icons.refresh, color: Colors.blue[900]),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey[200],
                          minimumSize: Size(50, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 10),
                  ElevatedButton.icon(
                    onPressed: _testConnection,
                    icon: Icon(Icons.wifi_find, color: Colors.white),
                    label: Text('TESTAR CONEXÃO', style: TextStyle(color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.indigo[400],
                      minimumSize: Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 30),

            // Seção: Conta
            _buildSectionHeader('Sua Conta'),
            SizedBox(height: 15),
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  Obx(() {
                    final user = _auth.user.value;
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.blue[100],
                        child: Icon(Icons.person, color: Colors.blue[900]),
                      ),
                      title: Text(user?.firstName ?? 'Usuário', style: TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(user?.email ?? 'email@exemplo.com', style: TextStyle(fontSize: 12)),
                    );
                  }),
                  Divider(),
                  ListTile(
                    leading: Icon(Icons.logout, color: Colors.red[700]),
                    title: Text('Sair do Aplicativo', style: TextStyle(color: Colors.red[700], fontWeight: FontWeight.bold)),
                    onTap: () {
                      Get.defaultDialog(
                        title: 'Sair?',
                        middleText: 'Deseja realmente encerrar a sessão?',
                        textConfirm: 'Sim',
                        textCancel: 'Não',
                        confirmTextColor: Colors.white,
                        onConfirm: () {
                          _auth.logout();
                          Get.back();
                          Get.offAllNamed(Routes.LOGIN);
                        },
                      );
                    },
                  ),
                ],
              ),
            ),

            SizedBox(height: 40),

            Center(
              child: Column(
                children: [
                  Text('GestorFarma Pro', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey[700])),
                  Text('Versão Business 1.1.0', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                  SizedBox(height: 10),
                  Text('© 2026 - Gestão Farmacêutica Inteligente', style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue[900]),
    );
  }

  @override
  void dispose() {
    _ipController.dispose();
    _ivaController.dispose();
    super.dispose();
  }
}
