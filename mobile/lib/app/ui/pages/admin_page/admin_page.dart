import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';

class AdminPage extends StatefulWidget {
  @override
  _AdminPageState createState() => _AdminPageState();
}

class _AdminPageState extends State<AdminPage> {
  final ApiProvider _api = ApiProvider();
  dynamic stats;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final res = await _api.get('/accounts/admin/stats/');
      if (res.statusCode == 200) {
        setState(() {
          stats = res.data;
          isLoading = false;
        });
      }
    } catch (e) {
      Get.snackbar('Erro', 'Erro ao carregar estatísticas');
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Plataforma GestorFarma', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.blue[900])),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(icon: Icon(Icons.refresh, color: Colors.blue), onPressed: _fetchStats)
        ],
      ),
      body: isLoading 
        ? Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Visão Geral do Ecossistema", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                SizedBox(height: 20),
                _buildGridStats(),
                SizedBox(height: 30),
                _buildFinanceCard(),
                SizedBox(height: 30),
                _buildWarningCard("Aprovações Pendentes", stats['entregadores_pendentes'], Colors.orange),
                _buildWarningCard("Farmácias Pendentes", stats['farmacias_pendentes'], Colors.green),
              ],
            ),
          ),
    );
  }

  Widget _buildGridStats() {
    return GridView.count(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _statBox("USUÁRIOS", stats['total_usuarios'].toString(), Icons.people, Colors.blue),
        _statBox("FARMÁCIAS", stats['total_farmacias'].toString(), Icons.store, Colors.green),
        _statBox("ENTREGADORES", stats['total_entregadores'].toString(), Icons.bike_scooter, Colors.purple),
        _statBox("PEDIDOS", stats['total_pedidos'].toString(), Icons.shopping_cart, Colors.orange),
      ],
    );
  }

  Widget _statBox(String label, String val, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)]
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 20),
          SizedBox(height: 8),
          Text(val, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
          Text(label, style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildFinanceCard() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Colors.blue[800]!, Colors.blue[600]!]),
        borderRadius: BorderRadius.circular(25),
        boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.3), blurRadius: 20, offset: Offset(0, 10))]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("RECEITA TOTAL", style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
          Text("${stats['receita_total']} MT", style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
          SizedBox(height: 20),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(15)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Comissão Plataforma (10%)", style: TextStyle(color: Colors.white, fontSize: 12)),
                Text("${stats['comissao_plataforma']} MT", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildWarningCard(String title, int count, Color color) {
    if (count == 0) return SizedBox.shrink();
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3))
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
          CircleAvatar(
            backgroundColor: color,
            radius: 12,
            child: Text(count.toString(), style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }
}
