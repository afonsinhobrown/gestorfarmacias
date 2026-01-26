import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';
import '../../../data/services/config_service.dart';
import 'package:url_launcher/url_launcher.dart';

class FinancesPage extends StatefulWidget {
  @override
  _FinancesPageState createState() => _FinancesPageState();
}

class _FinancesPageState extends State<FinancesPage> with SingleTickerProviderStateMixin {
  final ApiProvider _api = ApiProvider();
  late TabController _tabController;
  
  // Dados Consolidados
  Map<String, dynamic>? report;
  double totalVendas = 0;
  double totalDespesas = 0;
  double totalIva = 0;
  double taxaIva = 16;
  List<dynamic> transacoes = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    try {
      final res = await _api.get('farmacias/dashboard/report/');
      if (res.statusCode == 200) {
        setState(() {
          report = res.data;
          final fluxo = report!['fluxo_caixa'];
          totalVendas = double.tryParse(fluxo['total_receita'].toString()) ?? 0;
          totalDespesas = double.tryParse(fluxo['total_despesa'].toString()) ?? 0;
          totalIva = double.tryParse(fluxo['total_iva'].toString()) ?? 0;
          taxaIva = double.tryParse(fluxo['taxa_iva'].toString()) ?? 16;
          transacoes = report!['transacoes'] ?? [];
        });
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha ao carregar relatório financeiro');
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final saldoLiquido = totalVendas - totalDespesas;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Gestão Financeira', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.indigo[900],
        iconTheme: IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: Icon(Icons.picture_as_pdf),
            onPressed: _downloadReport,
          )
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: [
            Tab(text: 'RESUMO'),
            Tab(text: 'MOVIMENTAÇÃO'),
          ],
        ),
      ),
      body: isLoading 
        ? Center(child: CircularProgressIndicator())
        : TabBarView(
            controller: _tabController,
            children: [
              // ABA 1: RESUMO (Vendas vs Despesas vs IVA)
              RefreshIndicator(
                onRefresh: _loadData,
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(16),
                  physics: AlwaysScrollableScrollPhysics(),
                  child: Column(
                    children: [
                      // Card Principal (Saldo)
                      Container(
                        width: double.infinity,
                        padding: EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: saldoLiquido >= 0 
                              ? [Colors.blue[900]!, Colors.blue[700]!] 
                              : [Colors.red[900]!, Colors.red[700]!],
                            begin: Alignment.topLeft,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]
                        ),
                        child: Column(
                          children: [
                            Text('SALDO LÍQUIDO (CAIXA)', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                            SizedBox(height: 8),
                            Text('${saldoLiquido.toStringAsFixed(2)} MT', style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
                            SizedBox(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _buildMiniStat('Entradas', totalVendas, Colors.greenAccent),
                                Container(height: 30, width: 1, color: Colors.white24),
                                _buildMiniStat('Saídas', totalDespesas, Colors.redAccent),
                              ],
                            )
                          ],
                        ),
                      ),
                      
                      SizedBox(height: 20),
                      
                      // Card IVA (NOVO)
                      Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.orange[50],
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(color: Colors.orange[200]!)
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.account_balance, color: Colors.orange[800], size: 30),
                            SizedBox(width: 15),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Impostos Estimados (${taxaIva.toStringAsFixed(0)}% IVA)', style: TextStyle(color: Colors.orange[900], fontWeight: FontWeight.bold, fontSize: 12)),
                                  Text('${totalIva.toStringAsFixed(2)} MT', style: TextStyle(color: Colors.orange[900], fontSize: 20, fontWeight: FontWeight.w900)),
                                  Text('Incluso nas vendas do período', style: TextStyle(color: Colors.orange[700], fontSize: 10)),
                                ],
                              ),
                            ),
                            Icon(Icons.info_outline, color: Colors.orange[300], size: 20),
                          ],
                        ),
                      ),

                      SizedBox(height: 24),
                      Align(alignment: Alignment.centerLeft, child: Text('Lançamentos Recentes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
                      SizedBox(height: 10),
                      ListView.builder(
                        padding: EdgeInsets.zero,
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        itemCount: transacoes.take(10).length,
                        itemBuilder: (context, index) => _buildTransacaoItem(transacoes[index]),
                      ),
                    ],
                  ),
                ),
              ),

              // ABA 2: LISTA COMPLETA
              RefreshIndicator(
                onRefresh: _loadData,
                child: transacoes.isEmpty 
                  ? Center(child: Text("Nenhuma transação registrada")) 
                  : ListView.builder(
                      padding: EdgeInsets.all(16),
                      itemCount: transacoes.length,
                      itemBuilder: (context, index) => _buildTransacaoItem(transacoes[index]),
                    ),
              ),
            ],
          ),
      floatingActionButton: _tabController.index == 1 
        ? FloatingActionButton(
            backgroundColor: Colors.indigo[900],
            child: Icon(Icons.add, color: Colors.white),
            onPressed: () => Get.snackbar('Info', 'Novas despesas devem ser cadastradas via Portal Web.'),
          )
        : null,
    );
  }

  Widget _buildMiniStat(String label, double value, Color color) {
    return Column(
      children: [
        Text(label, style: TextStyle(color: Colors.white70, fontSize: 12)),
        Text('${value.toStringAsFixed(2)}', style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }
  
  Widget _buildTransacaoItem(dynamic item) {
    final bool isEntrada = item['tipo'] == 'ENTRADA';
    
    return Card(
      margin: EdgeInsets.only(bottom: 10),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey[200]!)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isEntrada ? Colors.green[50] : Colors.red[50], 
          child: Icon(isEntrada ? Icons.arrow_downward : Icons.arrow_upward, color: isEntrada ? Colors.green : Colors.red, size: 18)
        ),
        title: Text(item['descricao'] ?? '---', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(item['data']?.split('T')[0] ?? '', style: TextStyle(fontSize: 11)),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('${isEntrada ? '+' : '-'} ${double.parse(item['valor'].toString()).abs().toStringAsFixed(2)} MT', 
              style: TextStyle(fontWeight: FontWeight.bold, color: isEntrada ? Colors.green[700] : Colors.red[700], fontSize: 14)
            ),
            Text(item['metodo'] ?? '', style: TextStyle(fontSize: 9, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Future<void> _downloadReport() async {
    final ConfigService config = Get.find();
    final url = Uri.parse('${config.baseUrl.value}pedidos/relatorios/vendas-pdf/');
    
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      Get.snackbar('Erro', 'Não foi possível gerar o PDF');
    }
  }
}
