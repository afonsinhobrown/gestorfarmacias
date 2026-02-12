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
    if (kIsWeb) return 'http://localhost:8000/api/v1/';
    
    // Windows Desktop
    if (defaultTargetPlatform == TargetPlatform.windows) {
      return 'http://localhost:8000/api/v1/';
    }
    
    // Produção - URL do Render
    return 'https://gestorfarmacias-backend.onrender.com/api/v1/';
  }

  void updateBaseUrl(String newUrl) {
    newUrl = newUrl.trim();
    if (newUrl.isEmpty) return;

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      // Se for IP, geralmente é HTTP
      if (RegExp(r'^\d{1,3}\.').hasMatch(newUrl)) {
         newUrl = 'http://$newUrl';
      } else {
         newUrl = 'https://$newUrl';
      }
    }
    
    if (!newUrl.contains('/api/v1')) {
      if (newUrl.endsWith('/')) {
        newUrl = '${newUrl}api/v1';
      } else {
        newUrl = '$newUrl/api/v1';
      }
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
