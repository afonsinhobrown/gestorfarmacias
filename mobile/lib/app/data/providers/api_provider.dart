import 'package:dio/dio.dart';
import 'package:get/get.dart' hide Response; // Evitar conflito com Response do Dio
import 'package:get_storage/get_storage.dart';
import '../services/config_service.dart';

class ApiProvider {
  final Dio _dio = Dio();
  final GetStorage _box = GetStorage();
  final ConfigService _config = Get.find<ConfigService>();
  
  ApiProvider() {
    String base = _config.baseUrl.value;
    if (!base.endsWith('/')) base = '$base/';
    _dio.options.baseUrl = base;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
    
    // Atualiza a URL se ela mudar no ConfigService
    _config.baseUrl.listen((newUrl) {
      if (!newUrl.endsWith('/')) newUrl = '$newUrl/';
      _dio.options.baseUrl = newUrl;
    });
    
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _box.read('token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        print('Erro na API: ${e.response?.statusCode} - ${e.message}');
        return handler.next(e);
      },
    ));
  }

  Future<Response> login(String email, String password) async {
    return await _dio.post('auth/login/', data: {
      'email': email,
      'password': password,
    });
  }

  Future<Response> get(String path) async {
      final cleanPath = path.startsWith('/') ? path.substring(1) : path;
      return await _dio.get(cleanPath);
  }

  Future<Response> post(String path, {dynamic data}) async {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return await _dio.post(cleanPath, data: data);
  }

  Future<Response> patch(String path, {dynamic data}) async {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return await _dio.patch(cleanPath, data: data);
  }

  Future<Response> delete(String path) async {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return await _dio.delete(cleanPath);
  }

  // Métodos específicos
  Future<Response> getEntregasDisponiveis() async => await _dio.get('/entregas/disponiveis/');
  Future<Response> getMinhasEntregas() async => await _dio.get('/entregas/minhas/');
}
