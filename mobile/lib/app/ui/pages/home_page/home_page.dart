import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/services/auth_service.dart';
import '../client_page/client_page.dart';
import '../delivery_page/delivery_page.dart';
import '../admin_page/admin_page.dart';
import '../stock_page/stock_page.dart';
import '../orders_page/orders_page.dart';
import '../finances_page/finances_page.dart';
import '../suppliers_page/suppliers_page.dart';
import '../customers_page/customers_page.dart';
import '../pos_page/pos_page.dart';
import '../settings_page/settings_page.dart';
import '../payments_page/payments_page.dart';
import '../../../modules/home/controllers/home_controller.dart';
import '../../../routes/app_pages.dart';
import 'dart:ui';

class HomePage extends StatelessWidget {
  final AuthService _authService = Get.find();
  final HomeController _controller = Get.put(HomeController());

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final user = _authService.user.value;
      if (user == null) return Scaffold(body: Center(child: CircularProgressIndicator()));

      // Dispatcher baseada no tipo de usuário
      switch (user.tipoUsuario) {
        case 'ADMIN': return AdminPage();
        case 'CLIENTE': return ClientPage();
        case 'ENTREGADOR': return DeliveryPage();
        case 'FARMACIA':
        default: return _buildPharmacyHome(context);
      }
    });
  }

  Widget _buildPharmacyHome(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.blue[900],
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('GestorFarma Pro', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
            Text('Olá, ${_authService.user.value?.firstName ?? "Farmácia"}', style: TextStyle(fontSize: 12, color: Colors.white70)),
          ],
        ),
        actions: [
          IconButton(icon: Icon(Icons.refresh, color: Colors.white), onPressed: () => _controller.fetchDashboardStats()),
          IconButton(icon: Icon(Icons.logout, color: Colors.white), onPressed: () { _authService.logout(); Get.offAllNamed(Routes.LOGIN); })
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _controller.fetchDashboardStats(),
        child: SingleChildScrollView(
          physics: AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Resumo Financeiro (KPI Card)
              _buildBigKpiCard(),
              SizedBox(height: 30),
              
              // 2. Operações Rápidas (Grid)
              Text('Operações de Balcão', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue[900])),
              SizedBox(height: 15),
              GridView.count(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 15,
                mainAxisSpacing: 15,
                childAspectRatio: 1.1,
                children: [
                  _buildActionCard('Venda POS', Icons.point_of_sale, Colors.green, () => Get.to(() => PosPage())),
                  _buildActionCard('Meu Estoque', Icons.inventory, Colors.purple, () => Get.to(() => StockPage())),
                ],
              ),
              
              SizedBox(height: 30),
              
              // 3. Área de Gestão
              Text('Módulos de Gestão', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue[900])),
              SizedBox(height: 15),
              GridView.count(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                crossAxisCount: 3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.0,
                children: [
                  _miniMenuCard('Pedidos', Icons.assignment, Colors.orange, () => Get.to(() => OrdersPage())),
                  _miniMenuCard('Clientes', Icons.people, Colors.pink, () => Get.to(() => CustomersPage())),
                  _miniMenuCard('Fornecedores', Icons.badge, Colors.teal, () => Get.to(() => SuppliersPage())),
                  _miniMenuCard('Financeiro', Icons.analytics, Colors.indigo, () => Get.to(() => FinancesPage())),
                  _miniMenuCard('Pagamentos', Icons.payment, Colors.green, () => Get.to(() => PaymentsPage())),
                  _miniMenuCard('Config', Icons.settings, Colors.grey, () => Get.to(() => SettingsPage())),
                ],
              ),
              
              SizedBox(height: 30),
              
              // 4. Últimas Vendas
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Vendas Recentes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue[900])),
                  TextButton(onPressed: () => Get.to(() => FinancesPage()), child: Text('Ver Histórico')),
                ],
              ),
              Obx(() => _controller.isLoading.value 
                ? Center(child: CircularProgressIndicator())
                : _controller.recentOrders.isEmpty ? _buildNoRecent() : _buildRecentList()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBigKpiCard() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Colors.blue[900]!, Colors.blue[600]!], begin: Alignment.topLeft),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.3), blurRadius: 15, offset: Offset(0, 8))]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('FATURAMENTO HOJE', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
          SizedBox(height: 8),
          Obx(() => Text(_controller.vendasHoje.value, style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900))),
          SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.shopping_bag_outlined, color: Colors.white70, size: 14),
              SizedBox(width: 5),
              Obx(() => Text('${_controller.pedidosPendentes.value} pedidos aguardando ação', style: TextStyle(color: Colors.white70, fontSize: 11))),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildActionCard(String title, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.1)), boxShadow: [BoxShadow(color: color.withOpacity(0.05), blurRadius: 10)]),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(padding: EdgeInsets.all(12), decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle), child: Icon(icon, color: color, size: 32)),
            SizedBox(height: 10),
            Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.grey[800])),
          ],
        ),
      ),
    );
  }

  Widget _miniMenuCard(String label, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15), border: Border.all(color: Colors.grey.shade100)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            SizedBox(height: 6),
            Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[700])),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      itemCount: _controller.recentOrders.length,
      itemBuilder: (context, index) {
        final p = _controller.recentOrders[index];
        return Container(
          margin: EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15), border: Border.all(color: Colors.grey.shade50)),
          child: ListTile(
            leading: CircleAvatar(backgroundColor: Colors.grey[100], child: Icon(Icons.receipt_long, size: 20, color: Colors.blue[900])),
            title: Text('Venda #${p['numero_pedido'] ?? p['id']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            subtitle: Text(p['cliente_nome'] ?? 'Final', style: TextStyle(fontSize: 10)),
            trailing: Text('${p['total']} MT', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.green[700])),
          ),
        );
      },
    );
  }

  Widget _buildNoRecent() {
    return Center(child: Padding(padding: EdgeInsets.all(20), child: Text("Sem atividades registradas", style: TextStyle(color: Colors.grey, fontSize: 12))));
  }
}
