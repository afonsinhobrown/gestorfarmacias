import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';

class CustomersPage extends StatefulWidget {
  @override
  _CustomersPageState createState() => _CustomersPageState();
}

class _CustomersPageState extends State<CustomersPage> {
  final ApiProvider _api = ApiProvider();
  List<dynamic> customers = [];
  bool isLoading = false;
  String search = "";

  Future<void> _fetchCustomers() async {
    if (search.isEmpty) return;
    setState(() => isLoading = true);
    try {
      final res = await _api.get('/auth/clientes/?search=$search');
      if (res.statusCode == 200) {
        setState(() {
          customers = res.data['results'] ?? res.data;
          isLoading = false;
        });
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha na busca global');
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Busca de Clientes', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.pink[700],
        iconTheme: IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.pink[700],
            child: TextField(
              onChanged: (v) {
                search = v;
                _fetchCustomers();
              },
              style: TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Nome, Telefone ou Email...',
                hintStyle: TextStyle(color: Colors.white70),
                prefixIcon: Icon(Icons.search, color: Colors.white70),
                filled: true,
                fillColor: Colors.white.withOpacity(0.1),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),
          Expanded(
            child: isLoading 
              ? Center(child: CircularProgressIndicator())
              : customers.isEmpty 
                ? _buildEmptyState()
                : ListView.builder(
                    padding: EdgeInsets.all(12),
                    itemCount: customers.length,
                    itemBuilder: (context, index) => _buildCustomerCard(customers[index]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person_search_outlined, size: 80, color: Colors.grey[200]),
          SizedBox(height: 16),
          Text(search.isEmpty ? "Digite para buscar um cliente" : "Nenhum cliente encontrado", style: TextStyle(color: Colors.grey[400])),
        ],
      ),
    );
  }

  Widget _buildCustomerCard(dynamic c) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: ListTile(
        contentPadding: EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: Colors.pink[50],
          child: Text(c['first_name'][0], style: TextStyle(color: Colors.pink, fontWeight: FontWeight.bold)),
        ),
        title: Text('${c['first_name']} ${c['last_name']}', style: TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('Tel: ${c['telefone'] ?? "N/A"}'),
        trailing: Text('ID #${c['id']}', style: TextStyle(fontSize: 10, color: Colors.grey)),
      ),
    );
  }
}
