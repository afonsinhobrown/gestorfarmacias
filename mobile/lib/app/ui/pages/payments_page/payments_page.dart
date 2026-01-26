import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';
import 'package:intl/intl.dart';

class PaymentsPage extends StatefulWidget {
  @override
  _PaymentsPageState createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage> with SingleTickerProviderStateMixin {
  final ApiProvider _api = ApiProvider();
  
  late TabController _tabController;
  List<dynamic> pagamentos = [];
  Map<String, dynamic>? stats;
  bool isLoading = true;
  String filtroStatus = 'TODOS';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => isLoading = true);
    try {
      // Buscar pagamentos e estatísticas em paralelo
      final results = await Future.wait([
        _api.get('pagamentos/'),
        _api.get('pagamentos/stats/'),
      ]);

      if (results[0].statusCode == 200 && results[1].statusCode == 200) {
        setState(() {
          pagamentos = results[0].data['results'] ?? results[0].data;
          stats = results[1].data;
        });
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha ao carregar pagamentos: $e', backgroundColor: Colors.red[100]);
    } finally {
      setState(() => isLoading = false);
    }
  }

  List<dynamic> get _filteredPagamentos {
    if (filtroStatus == 'TODOS') return pagamentos;
    return pagamentos.where((p) => p['status'] == filtroStatus).toList();
  }

  List<dynamic> get _pendentes => pagamentos.where((p) => p['status'] == 'PENDENTE').toList();
  List<dynamic> get _aprovados => pagamentos.where((p) => p['status'] == 'APROVADO').toList();
  List<dynamic> get _recusados => pagamentos.where((p) => p['status'] == 'RECUSADO').toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Gestão de Pagamentos', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.green[800],
        iconTheme: IconThemeData(color: Colors.white),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: [
            Tab(text: 'Todos'),
            Tab(text: 'Pendentes'),
            Tab(text: 'Aprovados'),
            Tab(text: 'Recusados'),
          ],
        ),
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: Column(
                children: [
                  // Card de Estatísticas
                  if (stats != null) _buildStatsCard(),
                  
                  // Lista de Pagamentos
                  Expanded(
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildPagamentosList(pagamentos),
                        _buildPagamentosList(_pendentes),
                        _buildPagamentosList(_aprovados),
                        _buildPagamentosList(_recusados),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatsCard() {
    return Container(
      margin: EdgeInsets.all(16),
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green[800]!, Colors.green[600]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.3),
            blurRadius: 15,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'RESUMO FINANCEIRO',
            style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
          ),
          SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem('Total Recebido', '${stats!['total_recebido']} MT', Icons.check_circle),
              _buildStatItem('Pendente', '${stats!['total_pendente']} MT', Icons.pending),
            ],
          ),
          SizedBox(height: 15),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem('Hoje', '${stats!['total_hoje']} MT', Icons.today),
              _buildStatItem('Aprovados', '${stats!['qtd_aprovados']}', Icons.done_all),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.white70, size: 14),
            SizedBox(width: 5),
            Text(label, style: TextStyle(color: Colors.white70, fontSize: 11)),
          ],
        ),
        SizedBox(height: 4),
        Text(value, style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildPagamentosList(List<dynamic> lista) {
    if (lista.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.payment_outlined, size: 60, color: Colors.grey[300]),
            SizedBox(height: 12),
            Text('Nenhum pagamento encontrado', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(12),
      itemCount: lista.length,
      itemBuilder: (context, index) => _buildPagamentoCard(lista[index]),
    );
  }

  Widget _buildPagamentoCard(dynamic pag) {
    Color statusColor = _getStatusColor(pag['status']);
    IconData statusIcon = _getStatusIcon(pag['status']);
    
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: InkWell(
        onTap: () => _showPagamentoDetails(pag),
        borderRadius: BorderRadius.circular(15),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          pag['numero_transacao'] ?? 'N/A',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Pedido: ${pag['pedido_numero'] ?? pag['pedido']}',
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(statusIcon, size: 14, color: statusColor),
                        SizedBox(width: 5),
                        Text(
                          pag['status_display'] ?? pag['status'],
                          style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Método', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                      SizedBox(height: 4),
                      Text(
                        pag['metodo_display'] ?? pag['metodo'],
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('Valor Total', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                      SizedBox(height: 4),
                      Text(
                        '${pag['valor_total']} MT',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green[700]),
                      ),
                    ],
                  ),
                ],
              ),
              SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 12, color: Colors.grey[500]),
                  SizedBox(width: 5),
                  Text(
                    _formatDate(pag['data_criacao']),
                    style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'APROVADO':
        return Colors.green;
      case 'PENDENTE':
        return Colors.orange;
      case 'PROCESSANDO':
        return Colors.blue;
      case 'RECUSADO':
      case 'CANCELADO':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'APROVADO':
        return Icons.check_circle;
      case 'PENDENTE':
        return Icons.pending;
      case 'PROCESSANDO':
        return Icons.sync;
      case 'RECUSADO':
      case 'CANCELADO':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy HH:mm').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  void _showPagamentoDetails(dynamic pag) {
    Get.bottomSheet(
      Container(
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Detalhes do Pagamento', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  IconButton(icon: Icon(Icons.close), onPressed: () => Get.back()),
                ],
              ),
              SizedBox(height: 20),
              _buildDetailRow('Número da Transação', pag['numero_transacao']),
              _buildDetailRow('Pedido', pag['pedido_numero'] ?? pag['pedido'].toString()),
              _buildDetailRow('Método', pag['metodo_display'] ?? pag['metodo']),
              _buildDetailRow('Status', pag['status_display'] ?? pag['status']),
              _buildDetailRow('Valor', '${pag['valor']} MT'),
              _buildDetailRow('Taxa', '${pag['taxa_processamento']} MT'),
              _buildDetailRow('Total', '${pag['valor_total']} MT', isBold: true),
              _buildDetailRow('Data', _formatDate(pag['data_criacao'])),
              
              if (pag['status'] == 'PENDENTE') ...[
                SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _atualizarStatus(pag['id'], 'APROVADO'),
                        icon: Icon(Icons.check, color: Colors.white),
                        label: Text('APROVAR', style: TextStyle(color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          minimumSize: Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _atualizarStatus(pag['id'], 'RECUSADO'),
                        icon: Icon(Icons.close, color: Colors.white),
                        label: Text('RECUSAR', style: TextStyle(color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          minimumSize: Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String? value, {bool isBold = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 14)),
          Text(
            value ?? 'N/A',
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              fontSize: isBold ? 16 : 14,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _atualizarStatus(int id, String novoStatus) async {
    Get.back(); // Fechar bottom sheet
    
    try {
      final res = await _api.patch('pagamentos/$id/status/', data: {'status': novoStatus});
      
      if (res.statusCode == 200) {
        Get.snackbar('Sucesso', 'Status atualizado!', backgroundColor: Colors.green[100]);
        _fetchData();
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha ao atualizar status: $e', backgroundColor: Colors.red[100]);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
