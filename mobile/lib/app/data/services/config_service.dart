import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

class ConfigService extends GetxService {
  final _box = GetStorage();
  final RxString baseUrl = ''.obs;

  @override
  void onInit() {
    super.onInit();
    _loadBaseUrl();
  }

  void _loadBaseUrl() {
    String? storedUrl = _box.read('base_url');
    if (storedUrl != null && storedUrl.isNotEmpty) {
      baseUrl.value = storedUrl;
    } else {
      baseUrl.value = _getDefaultUrl();
    }
  }

  String _getDefaultUrl() {
    if (kIsWeb) return 'http://localhost:8000/api/v1';
    
    // Windows Desktop
    if (defaultTargetPlatform == TargetPlatform.windows) {
      return 'http://localhost:8000/api/v1/';
    }
    
    // Para Android - IMPORTANTE: Trocar este IP pelo IP da sua máquina
    // Execute 'ipconfig' no Windows e use o IPv4 da sua rede Wi-Fi
    // Exemplo: Se seu PC está em 192.168.100.3, use esse IP aqui
    return 'http://192.168.100.3:8000/api/v1/';
  }

  void updateBaseUrl(String newUrl) {
    if (!newUrl.startsWith('http')) {
      newUrl = 'http://$newUrl';
    }
    if (!newUrl.contains('/api/v1')) {
      newUrl = '$newUrl/api/v1';
    }
    if (!newUrl.endsWith('/')) {
      newUrl = '$newUrl/';
    }
    baseUrl.value = newUrl;
    _box.write('base_url', newUrl);
  }

  void resetToDefault() {
    final defaultUrl = _getDefaultUrl();
    updateBaseUrl(defaultUrl);
  }
}
