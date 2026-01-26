import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';

class ClientRegistrationPage extends StatefulWidget {
  @override
  _ClientRegistrationPageState createState() => _ClientRegistrationPageState();
}

class _ClientRegistrationPageState extends State<ClientRegistrationPage> {
  final ApiProvider _api = ApiProvider();
  final _formKey = GlobalKey<FormState>();

  final nomeController = TextEditingController();
  final emailController = TextEditingController();
  final telefoneController = TextEditingController();
  final nuitController = TextEditingController();
  bool isSaving = false;

  Future<void> _registerClient() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => isSaving = true);
    try {
      // Novo endpoint de clientes (não cria usuário, apenas registro)
      final res = await _api.post('clientes/criar/', data: {
        'nome_completo': nomeController.text.trim(),
        'telefone': telefoneController.text.trim(),
        'nuit': nuitController.text.trim(),
      });

      if (res.statusCode == 201) {
        Get.back(result: nomeController.text);
        Get.snackbar('Sucesso', 'Cliente cadastrado com sucesso!', backgroundColor: Colors.green[100]);
      }
    } catch (e) {
      print('Erro detalhado: $e');
      Get.snackbar('Erro', 'Falha ao cadastrar cliente: $e', backgroundColor: Colors.red[100]);
    } finally {
      setState(() => isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Cadastrar Novo Cliente")),
      body: Padding(
        padding: EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(controller: nomeController, decoration: InputDecoration(labelText: "Nome Completo *"), validator: (v) => v!.isEmpty ? "Obrigatório" : null),
              TextFormField(controller: telefoneController, decoration: InputDecoration(labelText: "Telefone *"), keyboardType: TextInputType.phone, validator: (v) => v!.isEmpty ? "Obrigatório" : null),
              TextFormField(controller: nuitController, decoration: InputDecoration(labelText: "NUIT (Opcional)")),
              TextFormField(controller: emailController, decoration: InputDecoration(labelText: "Email (Opcional)"), keyboardType: TextInputType.emailAddress),
              SizedBox(height: 30),
              ElevatedButton(
                onPressed: isSaving ? null : _registerClient,
                style: ElevatedButton.styleFrom(minimumSize: Size(double.infinity, 50), backgroundColor: Colors.blue[900]),
                child: Text(isSaving ? "CADASTRANDO..." : "SALVAR CLIENTE", style: TextStyle(color: Colors.white)),
              )
            ],
          ),
        ),
      ),
    );
  }
}
