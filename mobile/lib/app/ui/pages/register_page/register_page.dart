import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';
import '../../../routes/app_pages.dart';

class RegisterPage extends StatefulWidget {
  @override
  _RegisterPageState createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final ApiProvider _api = ApiProvider();
  
  final _nomeController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _telefoneController = TextEditingController();
  
  String _tipoUsuario = 'CLIENTE';
  bool _isLoading = false;

  Future<void> _register() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      Get.snackbar('Erro', 'Preencha todos os campos');
      return;
    }

    setState(() => _isLoading = true);
    try {
      // Endpoint depende do tipo de usuário
      String endpoint = '/auth/register/cliente/';
      if (_tipoUsuario == 'ENTREGADOR') endpoint = '/auth/register/motoboy/';
      
      final res = await _api.post(endpoint, data: {
        'nome': _nomeController.text,
        'email': _emailController.text,
        'password': _passwordController.text,
        'telefone': _telefoneController.text,
      });

      if (res.statusCode == 201) {
        Get.snackbar('Sucesso', 'Conta criada! Faça login agora.');
        Get.offNamed(Routes.LOGIN);
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha no cadastro. Verifique os dados.');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Nova Conta", style: TextStyle(fontWeight: FontWeight.bold))),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(controller: _nomeController, decoration: InputDecoration(labelText: "Nome Completo", border: OutlineInputBorder())),
            SizedBox(height: 16),
            TextField(controller: _emailController, decoration: InputDecoration(labelText: "Email", border: OutlineInputBorder())),
            SizedBox(height: 16),
            TextField(controller: _telefoneController, decoration: InputDecoration(labelText: "Telefone", border: OutlineInputBorder())),
            SizedBox(height: 16),
            TextField(controller: _passwordController, obscureText: true, decoration: InputDecoration(labelText: "Senha", border: OutlineInputBorder())),
            SizedBox(height: 24),
            
            Text("Sou um:", style: TextStyle(fontWeight: FontWeight.bold)),
            Row(
              children: [
                Radio(value: 'CLIENTE', groupValue: _tipoUsuario, onChanged: (v) => setState(() => _tipoUsuario = v as String)),
                Text("Cliente"),
                Radio(value: 'ENTREGADOR', groupValue: _tipoUsuario, onChanged: (v) => setState(() => _tipoUsuario = v as String)),
                Text("Entregador"),
              ],
            ),

            SizedBox(height: 32),
            _isLoading 
              ? CircularProgressIndicator()
              : ElevatedButton(
                  onPressed: _register,
                  style: ElevatedButton.styleFrom(minimumSize: Size(double.infinity, 55), backgroundColor: Colors.blue[800]),
                  child: Text("CRIAR MINHA CONTA", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
          ],
        ),
      ),
    );
  }
}
