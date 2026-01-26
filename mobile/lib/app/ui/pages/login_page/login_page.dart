import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../controllers/login_controller.dart';
import '../../../routes/app_pages.dart';

class LoginPage extends StatelessWidget {
  final controller = Get.put(LoginController());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.settings, color: Colors.blue[900]),
            onPressed: () => Get.toNamed(Routes.SETTINGS),
            tooltip: 'Configurar IP do Servidor',
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 0.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(Icons.local_pharmacy, size: 80, color: Colors.blue),
              SizedBox(height: 16),
              Text(
                'GestorFarma',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.blue[900]),
              ),
              SizedBox(height: 40),
              
              TextField(
                controller: controller.emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email_outlined),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: Colors.grey[50],
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              SizedBox(height: 16),
              
              TextField(
                controller: controller.passwordController,
                decoration: InputDecoration(
                  labelText: 'Senha',
                  prefixIcon: Icon(Icons.lock_outline),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: Colors.grey[50],
                ),
                obscureText: true,
              ),
              SizedBox(height: 24),
              
              Obx(() => ElevatedButton(
                onPressed: controller.isLoading.value ? null : () => controller.login(),
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  backgroundColor: Colors.blue[700],
                ),
                child: controller.isLoading.value 
                  ? SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text('ENTRAR', style: TextStyle(fontSize: 16, color: Colors.white)),
              )),

              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CREDENCIAIS DE TESTE:',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildCredentialRow('Admin:', 'admin@gestorfarma.com'),
                    _buildCredentialRow('Farmácia:', 'farmacia@gestorfarma.com'),
                    _buildCredentialRow('Entregador:', 'entregador@gestorfarma.com'),
                    _buildCredentialRow('Cliente:', 'cliente@gestorfarma.com'),
                    const SizedBox(height: 4),
                    Text(
                      'Senha padrão: admin123 ou farmacia123...',
                      style: TextStyle(fontSize: 11, color: Colors.grey[500], fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
              
              SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton(
                    onPressed: () => Get.toNamed(Routes.SETTINGS),
                    child: Text('Configurar Conexão', style: TextStyle(color: Colors.blue[900], fontWeight: FontWeight.bold)),
                  ),
                  Text('|', style: TextStyle(color: Colors.grey[300])),
                  TextButton(
                    onPressed: () {},
                    child: Text('Esqueci minha senha', style: TextStyle(color: Colors.grey[600])),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCredentialRow(String label, String email) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          Text(email, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}
