import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';
import '../../../data/services/auth_service.dart';

class OrdersPage extends StatefulWidget {
  @override
  _OrdersPageState createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> with SingleTickerProviderStateMixin {
  final ApiProvider _api = ApiProvider();
  final AuthService _auth = Get.find();
  
  late TabController _tabController;
  List<dynamic> todosPedidos = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchPedidos();
  }

  Future<void> _fetchPedidos() async {
    setState(() => isLoading = true);
    try {
      final res = await _api.get('/pedidos/'); // Endpoint lista pedidos da farmácia
      if (res.statusCode == 200) {
        setState(() {
          todosPedidos = res.data['results'] ?? res.data;
          isLoading = false;
        });
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha ao carregar pedidos: $e');
      setState(() => isLoading = false);
    }
  }

  List<dynamic> get _pendentes => todosPedidos.where((p) => p['status'] == 'PENDENTE').toList();
  List<dynamic> get _emAndamento => todosPedidos.where((p) => ['PRONTO', 'EM_TRANSITO'].contains(p['status'])).toList();
  List<dynamic> get _concluidos => todosPedidos.where((p) => p['status'] == 'ENTREGUE').toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Gestão de Pedidos', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.blue[800],
        iconTheme: IconThemeData(color: Colors.white),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: [
            Tab(text: 'Pendentes'),
            Tab(text: 'Em Rota'),
            Tab(text: 'Concluídos'),
          ],
        ),
      ),
      body: isLoading 
        ? Center(child: CircularProgressIndicator())
        : TabBarView(
            controller: _tabController,
            children: [
              _buildPedidoList(_pendentes),
              _buildPedidoList(_emAndamento),
              _buildPedidoList(_concluidos),
            ],
          ),
    );
  }

  Widget _buildPedidoList(List<dynamic> pedidos) {
    if (pedidos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_bag_outlined, size: 60, color: Colors.grey[300]),
            SizedBox(height: 12),
            Text("Nenhum pedido nesta categoria", style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(12),
      itemCount: pedidos.length,
      itemBuilder: (context, index) {
        final p = pedidos[index];
        return Card(
          margin: EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('#PED${p['numero_pedido'] ?? p['id']}', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue[800])),
                    _buildStatusChip(p['status']),
                  ],
                ),
                Divider(height: 24),
                Row(
                  children: [
                    Icon(Icons.person_outline, size: 16, color: Colors.grey),
                    SizedBox(width: 8),
                    Text(p['cliente_nome'] ?? 'Consumidor Final', style: TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
                SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                    SizedBox(width: 8),
                    Expanded(child: Text(p['endereco_entrega'] ?? 'Venda de Balcão', style: TextStyle(fontSize: 12, color: Colors.grey[600]), maxLines: 1, overflow: TextOverflow.ellipsis)),
                  ],
                ),
                SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${p['total']} MT', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green[700])),
                    if (p['status'] == 'PENDENTE')
                       ElevatedButton(
                        onPressed: () => _atualizarStatus(p['id'], 'PRONTO'),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.blue[800], shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                        child: Text('MARCAR PRONTO', style: TextStyle(color: Colors.white, fontSize: 12)),
                      ),
                  ],
                )
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(String status) {
    Color color = Colors.grey;
    if (status == 'PENDENTE') color = Colors.orange;
    if (status == 'PRONTO') color = Colors.blue;
    if (status == 'EM_TRANSITO') color = Colors.indigo;
    if (status == 'ENTREGUE') color = Colors.green;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 10)),
    );
  }

  Future<void> _atualizarStatus(int id, String novoStatus) async {
     try {
       // Usando o path correto do backend /api/v1/pedidos/{id}/status/
       final res = await _api.patch('pedidos/$id/status/', data: {'status': novoStatus});
       if (res.statusCode == 200) {
         Get.snackbar('Sucesso', 'Status atualizado!');
         _fetchPedidos();
       }
     } catch (e) {
       Get.snackbar('Erro', 'Falha ao atualizar status: $e');
     }
  }
}
