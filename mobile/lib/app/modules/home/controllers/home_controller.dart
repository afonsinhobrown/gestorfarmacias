import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';

class HomeController extends GetxController {
  final ApiProvider _api = ApiProvider();
  
  final vendasHoje = '0,00 MTn'.obs;
  final pedidosPendentes = '0'.obs;
  final recentOrders = <Map<String, dynamic>>[].obs;
  final isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    fetchDashboardStats();
  }

  Future<void> fetchDashboardStats() async {
    try {
      isLoading(true);
      // Chamada real para o novo endpoint
      final res = await _api.get('/pedidos/dashboard/stats/'); // Usar método genérico se existir, ou adaptar
      
      if (res.statusCode == 200) {
        final data = res.data;
        // Formatação robusta para moeda moçambicana
        double total = double.tryParse(data['vendas_hoje'].toString()) ?? 0.0;
        vendasHoje.value = '${total.toStringAsFixed(2)} MT';
        pedidosPendentes.value = '${data['pedidos_pendentes'] ?? 0}';
        
        if (data['ultimos_pedidos'] != null) {
          recentOrders.value = List<Map<String, dynamic>>.from(data['ultimos_pedidos']);
        }
      }
    } catch (e) {
      print('Erro ao buscar stats: $e');
    } finally {
      isLoading(false);
    }
  }
}
