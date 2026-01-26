import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';

class SuppliersPage extends StatefulWidget {
  @override
  _SuppliersPageState createState() => _SuppliersPageState();
}

class _SuppliersPageState extends State<SuppliersPage> {
  final ApiProvider _api = ApiProvider();
  List<dynamic> suppliers = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchSuppliers();
  }

  Future<void> _fetchSuppliers() async {
    setState(() => isLoading = true);
    try {
      final res = await _api.get('/fornecedores/');
      if (res.statusCode == 200) {
        setState(() {
          suppliers = res.data['results'] ?? res.data;
          isLoading = false;
        });
      }
    } catch (e) {
      Get.snackbar('Erro', 'Erro ao carregar fornecedores');
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Fornecedores', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.teal[700],
        iconTheme: IconThemeData(color: Colors.white),
      ),
      body: isLoading 
        ? Center(child: CircularProgressIndicator())
        : suppliers.isEmpty 
          ? _buildEmptyState()
          : ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: suppliers.length,
              itemBuilder: (context, index) => _buildSupplierCard(suppliers[index]),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Get.snackbar('Web Only', 'O cadastro de fornecedores deve ser feito no Painel Web.'),
        backgroundColor: Colors.teal,
        child: Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.local_shipping_outlined, size: 80, color: Colors.grey[300]),
          SizedBox(height: 16),
          Text("Nenhum fornecedor cadastrado", style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildSupplierCard(dynamic s) {
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.teal[50],
                  child: Icon(Icons.business, color: Colors.teal),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s['nome'] ?? 'Fornecedor', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text(s['email'] ?? '', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.phone, color: Colors.green),
                  onPressed: () => Get.snackbar('Telefone', s['telefone'] ?? 'Não informado'),
                )
              ],
            ),
            Divider(height: 24),
            Row(
              children: [
                Icon(Icons.category_outlined, size: 14, color: Colors.grey),
                SizedBox(width: 4),
                Text('Categoria: ${s['categoria'] ?? "Diversos"}', style: TextStyle(fontSize: 12)),
              ],
            )
          ],
        ),
      ),
    );
  }
}
