import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/providers/api_provider.dart';

class StockPage extends StatefulWidget {
  @override
  _StockPageState createState() => _StockPageState();
}

class _StockPageState extends State<StockPage> {
  final ApiProvider _api = ApiProvider();
  
  List<dynamic> items = [];
  List<dynamic> catalog = [];
  bool isLoading = true;
  String searchQuery = "";

  @override
  void initState() {
    super.initState();
    _fetchStock();
    _fetchCatalog();
  }

  Future<void> _fetchStock() async {
    setState(() => isLoading = true);
    try {
      final res = await _api.get('produtos/meu-estoque/?search=$searchQuery');
      if (res.statusCode == 200) {
        setState(() => items = res.data['results'] ?? res.data);
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha ao carregar estoque');
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _fetchCatalog() async {
    try {
      final res = await _api.get('produtos/catalogo/');
      if (res.statusCode == 200) {
        setState(() => catalog = res.data['results'] ?? res.data);
      }
    } catch (e) {}
  }

  void _showAddModal() {
    final _formKey = GlobalKey<FormState>();
    int? selectedProdId;
    double? precoVenda;
    double? precoCusto;
    int? qtd;
    String? lote;
    String? val;

    Get.bottomSheet(
      isScrollControlled: true,
      Container(
        height: MediaQuery.of(Get.context!).size.height * 0.85,
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("Adicionar ao Estoque", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    IconButton(icon: Icon(Icons.close), onPressed: () => Get.back()),
                  ],
                ),
                SizedBox(height: 20),
                
                // Produto
                DropdownButtonFormField<int>(
                  decoration: InputDecoration(
                    labelText: "Selecionar Produto *",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                  items: catalog.map((p) => DropdownMenuItem<int>(
                    value: p['id'], 
                    child: Text(p['nome'], overflow: TextOverflow.ellipsis)
                  )).toList(),
                  onChanged: (v) => selectedProdId = v,
                  validator: (v) => v == null ? 'Selecione um produto' : null,
                ),
                SizedBox(height: 15),
                
                // Preço Custo
                TextFormField(
                  decoration: InputDecoration(
                    labelText: "Preço Custo (MT) *",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  onChanged: (v) => precoCusto = double.tryParse(v),
                  validator: (v) => v == null || v.isEmpty ? 'Campo obrigatório' : null,
                ),
                SizedBox(height: 15),
                
                // Preço Venda
                TextFormField(
                  decoration: InputDecoration(
                    labelText: "Preço Venda (MT) *",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  onChanged: (v) => precoVenda = double.tryParse(v),
                  validator: (v) => v == null || v.isEmpty ? 'Campo obrigatório' : null,
                ),
                SizedBox(height: 15),
                
                // Quantidade
                TextFormField(
                  decoration: InputDecoration(
                    labelText: "Quantidade *",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (v) => qtd = int.tryParse(v),
                  validator: (v) => v == null || v.isEmpty ? 'Campo obrigatório' : null,
                ),
                SizedBox(height: 15),
                
                // Lote
                TextFormField(
                  decoration: InputDecoration(
                    labelText: "Lote (Opcional)",
                    hintText: "Deixe vazio para gerar automático",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                  onChanged: (v) => lote = v,
                  // Validador removido para permitir automático
                ),
                SizedBox(height: 15),
                
                // Validade
                TextFormField(
                  decoration: InputDecoration(
                    labelText: "Validade (AAAA-MM-DD) *",
                    hintText: "Ex: 2025-12-31",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                  onChanged: (v) => val = v,
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Campo obrigatório';
                    // Validação básica de formato
                    if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(v)) {
                      return 'Formato inválido (use AAAA-MM-DD)';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 25),
                
                // Botão Salvar
                ElevatedButton(
                  onPressed: () async {
                    if (!_formKey.currentState!.validate()) return;
                    
                    if (selectedProdId == null || precoCusto == null || precoVenda == null || 
                        qtd == null || val == null) {
                      Get.snackbar('Erro', 'Preencha todos os campos obrigatórios', backgroundColor: Colors.red[100]);
                      return;
                    }
                    
                    try {
                      final payload = {
                        'produto': selectedProdId,
                        'preco_venda': precoVenda,
                        'preco_custo': precoCusto,
                        'quantidade': qtd,
                        'lote': lote,
                        'data_validade': val,
                        'is_disponivel': true
                      };
                      
                      print('Enviando payload: $payload'); // Debug
                      
                      final res = await _api.post('produtos/meu-estoque/', data: payload);
                      
                      if (res.statusCode == 201) {
                        Get.back();
                        _fetchStock();
                        Get.snackbar('Sucesso', 'Produto adicionado ao estoque!', backgroundColor: Colors.green[100]);
                      }
                    } catch (e) {
                      print('Erro detalhado: $e');
                      Get.snackbar('Erro', 'Falha ao salvar: ${e.toString()}', backgroundColor: Colors.red[100]);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50), 
                    backgroundColor: Colors.blue[800],
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text("SALVAR NO ESTOQUE", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                )
              ],
            ),
          ),
        ),
      )
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Gestão de Estoque', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.blue[800],
        iconTheme: IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.blue[800],
            child: TextField(
              onChanged: (val) { searchQuery = val; _fetchStock(); },
              style: TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Buscar no estoque...',
                prefixIcon: Icon(Icons.search, color: Colors.white70),
                filled: true, fillColor: Colors.white.withOpacity(0.1),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),
          Expanded(
            child: isLoading 
              ? Center(child: CircularProgressIndicator())
              : items.isEmpty 
                ? _buildEmptyState()
                : ListView.builder(
                    padding: EdgeInsets.all(12),
                    itemCount: items.length,
                    itemBuilder: (context, index) => _buildStockItem(items[index]),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddModal,
        backgroundColor: Colors.blue[800],
        child: Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 80, color: Colors.grey[300]),
          SizedBox(height: 16),
          Text("Nenhum produto em estoque", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildStockItem(dynamic item) {
    int qtd = item['quantidade'] ?? 0;
    Color stockColor = qtd > 10 ? Colors.green : (qtd > 0 ? Colors.orange : Colors.red);

    return Card(
      margin: EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: ListTile(
        contentPadding: EdgeInsets.all(16),
        leading: Container(
          width: 50, height: 50,
          decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(10)),
          child: Icon(Icons.medication, color: Colors.blue[800]),
        ),
        title: Text(item['produto_nome'] ?? 'Sem Nome', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 4),
            Text('Lote: ${item['lote']} | Val: ${item['data_validade']}', style: TextStyle(fontSize: 12)),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(qtd.toString(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: stockColor)),
                Text('UNID', style: TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
            SizedBox(width: 10),
            IconButton(
              icon: Icon(Icons.delete_outline, color: Colors.red[300]),
              onPressed: () => _confirmDelete(item['id']),
            )
          ],
        ),
      ),
    );
  }

  void _confirmDelete(int id) {
    Get.defaultDialog(
      title: "Excluir?",
      middleText: "Deseja remover este item do seu estoque?",
      textConfirm: "Sim", textCancel: "Não",
      confirmTextColor: Colors.white,
      onConfirm: () async {
        await _api.delete('produtos/meu-estoque/$id/');
        Get.back();
        _fetchStock();
      }
    );
  }
}
