import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';
import '../../../data/services/auth_service.dart';

class ClientPage extends StatefulWidget {
  @override
  _ClientPageState createState() => _ClientPageState();
}

class _ClientPageState extends State<ClientPage> {
  final ApiProvider _api = ApiProvider();
  final AuthService _auth = Get.find();
  
  List<dynamic> farmacias = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFarmacias();
  }

  Future<void> _fetchFarmacias() async {
    try {
      final res = await _api.get('/farmacias/portal/');
      if (res.statusCode == 200) {
        setState(() {
          farmacias = res.data;
          isLoading = false;
        });
      }
    } catch (e) {
      Get.snackbar('Erro', 'Não foi possível carregar farmácias');
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120.0,
            floating: false,
            pinned: true,
            backgroundColor: Colors.blue[800],
            flexibleSpace: FlexibleSpaceBar(
              title: Text('Vila de Farmácias', style: TextStyle(fontWeight: FontWeight.bold)),
              background: Container(color: Colors.blue[900]),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   TextField(
                    decoration: InputDecoration(
                      hintText: 'Buscar medicamentos ou farmácias...',
                      prefixIcon: Icon(Icons.search),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
                    ),
                  ),
                  SizedBox(height: 20),
                  Text('Farmácias Próximas', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          isLoading 
            ? SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
            : farmacias.isEmpty 
              ? SliverFillRemaining(child: Center(child: Text("Nenhuma farmácia disponível")))
              : SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final f = farmacias[index];
                      return _buildFarmaciaCard(f);
                    },
                    childCount: farmacias.length,
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildFarmaciaCard(dynamic f) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 3,
      shadowColor: Colors.black26,
      child: InkWell(
        onTap: () {
          Get.snackbar('Em Breve', 'Visualização de produtos via mobile em desenvolvimento.');
        },
        borderRadius: BorderRadius.circular(20),
        child: Column(
          children: [
            Container(
              height: 120,
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                image: f['logo'] != null ? DecorationImage(image: NetworkImage(f['logo']), fit: BoxFit.contain) : null,
              ),
              child: f['logo'] == null ? Center(child: Icon(Icons.store, size: 50, color: Colors.blue[200])) : null,
            ),
            Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(f['nome'], style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        SizedBox(height: 4),
                        Text(f['bairro'], style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.star, color: Colors.amber, size: 16),
                          Text(' ${f['nota']}', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Text('Entrega: ${f['taxa_entrega']} MT', style: TextStyle(fontSize: 10, color: Colors.green[700], fontWeight: FontWeight.bold)),
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
