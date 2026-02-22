import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../data/providers/api_provider.dart';
import '../data/services/auth_service.dart';
import '../data/models/user_model.dart';
import '../routes/app_pages.dart';

class LoginController extends GetxController {
  final ApiProvider _apiProvider = ApiProvider();
  final AuthService _authService = Get.find();

  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final isLoading = false.obs;

  @override
  void onClose() {
    emailController.dispose();
    passwordController.dispose();
    super.onClose();
  }

  Future<void> login() async {
    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      Get.snackbar('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      isLoading.value = true;
      final response = await _apiProvider.login(
        emailController.text.trim().toLowerCase(), 
        passwordController.text
      );

      print('Login Response: ${response.data}'); // Debug

      if (response.statusCode == 200) {
        if (response.data['user'] == null) {
          throw 'Dados do usuário não encontrados na resposta';
        }
        
        final token = response.data['access'];
        final userData = User.fromJson(response.data['user']);
        
        _authService.login(userData, token);
        
        Get.offAllNamed(Routes.HOME);
        Get.snackbar('Sucesso', 'Bem-vindo ${userData.firstName ?? 'Usuário'}!');
      } else {
        Get.snackbar('Erro', 'Credenciais inválidas (${response.statusCode})');
      }
    } catch (e) {
      String msg = e.toString();
      if (e is dynamic && e.response?.data != null) {
        msg = e.response.data['detail'] ?? e.response.data['error'] ?? msg;
      }
      Get.snackbar('Erro', 'Falha ao realizar login: $msg');
    } finally {
      isLoading.value = false;
    }
  }
}
