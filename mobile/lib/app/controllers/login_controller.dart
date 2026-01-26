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
        emailController.text.trim(), 
        passwordController.text
      );

      print('Login Response: ${response.data}'); // Debug

      if (response.statusCode == 200) {
        final token = response.data['access'];
        // O backend retorna user aninhado em 'user'
        final userData = User.fromJson(response.data['user']);
        
        _authService.login(userData, token);
        
        Get.offAllNamed(Routes.HOME);
        Get.snackbar('Sucesso', 'Bem-vindo ${userData.firstName}!');
      } else {
        Get.snackbar('Erro', 'Credenciais inválidas');
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha ao realizar login: $e');
    } finally {
      isLoading.value = false;
    }
  }
}
