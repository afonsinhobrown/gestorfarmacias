import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';

class DeliveryPage extends StatefulWidget {
  @override
  _DeliveryPageState createState() => _DeliveryPageState();
}

class _DeliveryPageState extends State<DeliveryPage> {
  final ApiProvider _api = ApiProvider();
  List<dynamic> disponiveis = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchEntregas();
  }

  Future<void> _fetchEntregas() async {
    try {
      final res = await _api.get('/entregas/disponiveis/');
      if (res.statusCode == 200) {
        setState(() {
          disponiveis = res.data;
          isLoading = false;
        });
      }
    } catch (e) {
      Get.snackbar('Erro', 'Erro ao carregar entregas disponíveis');
      setState(() => isLoading = false);
    }
  }

  Future<void> _aceitarEntrega(int id) async {
    try {
       final res = await _api.post('/entregas/aceitar/$id/');
       if (res.statusCode == 200) {
         Get.snackbar('Sucesso', 'Entrega aceita! Vá buscar o pedido.');
         _fetchEntregas();
       }
    } catch (e) {
      Get.snackbar('Erro', 'Não foi possível aceitar a entrega');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[900],
      appBar: AppBar(
        title: Text('Central Logística', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(icon: Icon(Icons.refresh), onPressed: _fetchEntregas)
        ],
      ),
      body: Column(
        children: [
          _buildQuickStats(),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30))
              ),
              child: isLoading 
                ? Center(child: CircularProgressIndicator())
                : disponiveis.isEmpty 
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: EdgeInsets.all(20),
                      itemCount: disponiveis.length,
                      itemBuilder: (context, index) => _buildEntregaItem(disponiveis[index]),
                    ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildQuickStats() {
    return Container(
      padding: EdgeInsets.all(24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _statCol('DISPONÍVEIS', disponiveis.length.toString(), Colors.blue),
          _statCol('GANHOS HOJE', '0 MT', Colors.green),
        ],
      ),
    );
  }

  Widget _statCol(String label, String val, Color color) {
    return Column(
      children: [
        Text(val, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white)),
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[500])),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.directions_bike, size: 80, color: Colors.grey[200]),
          SizedBox(height: 16),
          Text("Sem entregas no momento", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
          Text("Fique online para receber novos pedidos", style: TextStyle(fontSize: 12, color: Colors.grey[400])),
        ],
      ),
    );
  }

  Widget _buildEntregaItem(dynamic item) {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(item['farmacia'], style: TextStyle(fontWeight: FontWeight.w900, color: Colors.blue[800], fontSize: 12)),
              Text('${item['taxa_entrega']} MT', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.green[700], fontSize: 18)),
            ],
          ),
          SizedBox(height: 12),
          Text('Pedido #${item['numero']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.location_on, size: 14, color: Colors.red),
              SizedBox(width: 4),
              Text('${item['bairro_origem']} → ${item['bairro_destino']}', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
            ],
          ),
          SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => _aceitarEntrega(item['pedido_id']),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              minimumSize: Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))
            ),
            child: Text("ACEITAR ROTA", style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white)),
          )
        ],
      ),
    );
  }
}
