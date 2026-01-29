import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart' as dio;
import 'dart:io';
import 'package:ai_barcode_scanner/ai_barcode_scanner.dart';
import '../../../data/providers/api_provider.dart';
import '../customers_page/client_registration_page.dart';

class PosPage extends StatefulWidget {
  @override
  _PosPageState createState() => _PosPageState();
}

class _PosPageState extends State<PosPage> {
  final ApiProvider _api = ApiProvider();
  
  // State
  List<dynamic> inventory = [];
  List<Map<String, dynamic>> cart = [];
  List<dynamic> clientSuggestions = [];
  
  String searchQuery = "";
  String clientSearch = "";
  String selectedPayment = "DINHEIRO";
  bool isLoading = false;
  bool isSaving = false;
  
  double valorRecebido = 0;
  double get troco => valorRecebido > 0 ? (valorRecebido - _total) : 0;
  File? receitaImage;  // Foto da receita médica

  @override
  void initState() {
    super.initState();
    _fetchInventory();
  }

  Future<void> _fetchInventory() async {
    setState(() => isLoading = true);
    try {
      final res = await _api.get('produtos/meu-estoque/?search=$searchQuery');
      if (res.statusCode == 200) {
        setState(() => inventory = res.data['results'] ?? res.data);
      }
    } catch (e) {
      Get.snackbar('Erro', 'Erro ao carregar catálogo');
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _openScanner() async {
    await Get.to(() => AiBarcodeScanner(
      onScan: (String code) {
        setState(() {
          searchQuery = code;
        });
        _fetchInventory().then((_) {
          // Se houver apenas 1 resultado exato, adiciona direto
          if (inventory.length == 1) {
            final prod = inventory[0];
            if (prod['produto_codigo'] == code || prod['produto_nome'].contains(code)) {
              _addToCart(prod);
              Get.back(); // Fecha scanner
              Get.snackbar("Sucesso", "${prod['produto_nome']} adicionado!");
            }
          }
        });
      },
      onDetect: (p0) {},
    ));
  }

  Future<void> _fetchClients(String q) async {
    if (q.length < 3) return;
    try {
      final res = await _api.get('clientes/?search=$q');
      if (res.statusCode == 200) {
        setState(() => clientSuggestions = res.data['results'] ?? res.data);
      }
    } catch (e) {}
  }

  void _addToCart(dynamic prod) {
    if (prod['quantidade'] <= 0) {
      Get.snackbar('Aviso', 'Produto sem estoque');
      return;
    }

    final index = cart.indexWhere((item) => item['id'] == prod['id']);
    if (index >= 0) {
      if (cart[index]['qtdVenda'] < prod['quantidade']) {
        setState(() => cart[index]['qtdVenda']++);
      } else {
        Get.snackbar('Limite', 'Estoque máximo atingido');
      }
    } else {
      setState(() => cart.add({...prod, 'qtdVenda': 1}));
    }
  }

  double get _total => cart.fold(0, (sum, item) => sum + (double.parse(item['preco_venda'].toString()) * item['qtdVenda']));

  Future<void> _finishSale() async {
    if (cart.isEmpty) return;
    setState(() => isSaving = true);
    try {
      // 1. Criar pedido (JSON PURO)
      final payload = {
        'itens': cart.map((i) => {
          'estoque_id': i['id'],
          'quantidade': i['qtdVenda'],
          'preco_unitario': i['preco_venda']
        }).toList(),
        'cliente': clientSearch.isEmpty ? 'Consumidor Final' : clientSearch,
        'tipo_pagamento': selectedPayment,
        'valor_pago': selectedPayment == "DINHEIRO" ? valorRecebido : _total,
        'troco': selectedPayment == "DINHEIRO" ? troco : 0,
        'vendedor': 'Operador Mobile', // Idealmente pegaria do AuthStore
      };

      print("Enviando venda: $payload");
      final res = await _api.post('pedidos/venda-balcao/', data: payload);
      
      if (res.statusCode == 201) {
        final pedidoId = res.data['id'];

        // 2. Upload da Receita (Se houver)
        if (receitaImage != null && pedidoId != null) {
          try {
            final formData = dio.FormData();
            formData.files.add(MapEntry(
              'receita_medica',
              await dio.MultipartFile.fromFile(receitaImage!.path, filename: 'receita.jpg'),
            ));

            await _api.patch('pedidos/$pedidoId/', data: formData);
          } catch (uploadError) {
            print("Erro upload receita: $uploadError");
            Get.snackbar('Aviso', 'Venda feita, mas erro ao enviar imagem da receita.');
          }
        }

        Get.defaultDialog(
          title: "Venda Realizada!",
          content: Column(
            children: [
              Icon(Icons.check_circle, color: Colors.green, size: 60),
              SizedBox(height: 16),
              Text("Pedido #${res.data['numero_pedido'] ?? res.data['numero']}"),
              Text("Total: ${_total.toStringAsFixed(2)} MT"),
              if (receitaImage != null) 
                Text("✓ Receita anexada", style: TextStyle(color: Colors.green, fontSize: 12)),
            ],
          ),
          confirm: ElevatedButton(onPressed: () => Get.back(), child: Text("OK"))
        );
        setState(() {
          cart.clear();
          clientSearch = "";
          clientSuggestions.clear();
          receitaImage = null;
        });
      }
    } catch (e) {
      print(e);
      Get.snackbar('Erro', 'Falha ao processar venda. Verifique conexão.');
    } finally {
      setState(() => isSaving = false);
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    final ImagePicker picker = ImagePicker();
    try {
      final XFile? image = await picker.pickImage(source: source);
      if (image != null) {
        setState(() => receitaImage = File(image.path));
        Get.snackbar('Sucesso', 'Receita médica adicionada!', backgroundColor: Colors.green[100]);
      }
    } catch (e) {
      Get.snackbar('Erro', 'Falha ao capturar imagem: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isWide = MediaQuery.of(context).size.width > 900;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text("Ponto de Venda (POS)", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.blue[900],
        iconTheme: IconThemeData(color: Colors.white),
      ),
      body: Row(
        children: [
          // Catálogo
          Expanded(
            flex: 2,
            child: Column(
              children: [
                Padding(
                  padding: EdgeInsets.all(16),
                  child: TextField(
                    onChanged: (v) { searchQuery = v; _fetchInventory(); },
                    decoration: InputDecoration(
                      hintText: "Buscar Medicamento...",
                      prefixIcon: Icon(Icons.search),
                      suffixIcon: IconButton(
                        icon: Icon(Icons.qr_code_scanner, color: Colors.blue[900]),
                        onPressed: _openScanner,
                      ),
                      filled: true, fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none)
                    ),
                  ),
                ),
                Expanded(
                  child: isLoading 
                    ? Center(child: CircularProgressIndicator())
                    : GridView.builder(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: isWide ? 4 : 2,
                          childAspectRatio: 0.8,
                          crossAxisSpacing: 10, mainAxisSpacing: 10
                        ),
                        itemCount: inventory.length,
                        itemBuilder: (context, index) => _buildProductCard(inventory[index]),
                      ),
                )
              ],
            ),
          ),
          
          // Carrinho (Sidebar)
          if (isWide || cart.isNotEmpty)
          Container(
            width: isWide ? 350 : MediaQuery.of(context).size.width * 0.4,
            decoration: BoxDecoration(color: Colors.white, border: Border(left: BorderSide(color: Colors.grey.shade200))),
            child: _buildCartPanel(),
          )
        ],
      ),
      floatingActionButton: !isWide && cart.isNotEmpty 
        ? FloatingActionButton.extended(
            onPressed: () => Get.bottomSheet(_buildCartPanel(), backgroundColor: Colors.white),
            label: Text("VER CARRINHO (${cart.length})"),
            icon: Icon(Icons.shopping_cart),
            backgroundColor: Colors.blue[900],
          )
        : null,
    );
  }

  Widget _buildProductCard(dynamic prod) {
    return InkWell(
      onTap: () => _addToCart(prod),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        child: Padding(
          padding: EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(10)),
                  child: Icon(Icons.medication, size: 40, color: Colors.blue[200]),
                ),
              ),
              SizedBox(height: 8),
              Text(prod['produto_nome'], style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
              Text("Lote: ${prod['lote']}", style: TextStyle(fontSize: 10, color: Colors.grey)),
              Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("${prod['preco_venda']} MT", style: TextStyle(fontWeight: FontWeight.w900, color: Colors.blue[800])),
                  CircleAvatar(radius: 12, backgroundColor: Colors.blue[800], child: Icon(Icons.add, size: 16, color: Colors.white)),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCartPanel() {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.all(20),
          color: Colors.grey[50],
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      onChanged: (v) { setState(() => clientSearch = v); _fetchClients(v); },
                      controller: TextEditingController(text: clientSearch)..selection = TextSelection.collapsed(offset: clientSearch.length),
                      decoration: InputDecoration(hintText: "Cliente (Opcional)", prefixIcon: Icon(Icons.person), isDense: true),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.person_add, color: Colors.blue[900]),
                    onPressed: () async {
                      final name = await Get.to(() => ClientRegistrationPage());
                      if (name != null) setState(() => clientSearch = name);
                    },
                  )
                ],
              ),
              if (clientSuggestions.isNotEmpty)
                Container(
                  constraints: BoxConstraints(maxHeight: 150),
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: clientSuggestions.length,
                    itemBuilder: (context, i) => ListTile(
                      title: Text(clientSuggestions[i]['nome_completo'] ?? 'Cliente'),
                      onTap: () => setState(() { clientSearch = clientSuggestions[i]['nome_completo'] ?? ''; clientSuggestions.clear(); }),
                    ),
                  ),
                )
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: cart.length,
            itemBuilder: (context, i) => ListTile(
              title: Text(cart[i]['produto_nome'], style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              subtitle: Text("${cart[i]['qtdVenda']} x ${cart[i]['preco_venda']}"),
              trailing: IconButton(icon: Icon(Icons.remove_circle_outline, color: Colors.red), onPressed: () => setState(() => cart.removeAt(i))),
            ),
          ),
        ),
        Container(
          padding: EdgeInsets.all(20),
          decoration: BoxDecoration(color: Colors.blue[900], borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
          child: Column(
            children: [
              DropdownButton<String>(
                value: selectedPayment,
                dropdownColor: Colors.blue[900],
                isExpanded: true,
                style: TextStyle(color: Colors.white),
                items: ["DINHEIRO", "POS", "MPESA", "EMOLA", "CREDITO"].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => setState(() => selectedPayment = v!),
              ),
              if (selectedPayment == "DINHEIRO") ...[
                SizedBox(height: 10),
                TextField(
                  keyboardType: TextInputType.number,
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: "VALOR RECEBIDO",
                    labelStyle: TextStyle(color: Colors.white70, fontSize: 10),
                    enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                    focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
                  ),
                  onChanged: (v) => setState(() => valorRecebido = double.tryParse(v) ?? 0),
                ),
                if (troco > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("TROCO", style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text("${troco.toStringAsFixed(2)} MT", style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
              ],
              SizedBox(height: 10),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text("TOTAL", style: TextStyle(color: Colors.white70)), Text("${_total.toStringAsFixed(2)} MT", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900))]),
              SizedBox(height: 15),
              
              // Seção de Receita Médica
              if (receitaImage != null)
                Container(
                  margin: EdgeInsets.only(bottom: 10),
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green[300], size: 20),
                      SizedBox(width: 8),
                      Expanded(child: Text("Receita anexada", style: TextStyle(color: Colors.white, fontSize: 12))),
                      IconButton(
                        icon: Icon(Icons.close, color: Colors.white70, size: 18),
                        onPressed: () => setState(() => receitaImage = null),
                      ),
                    ],
                  ),
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickImage(ImageSource.camera),
                        icon: Icon(Icons.camera_alt, color: Colors.white, size: 18),
                        label: Text("FOTO", style: TextStyle(color: Colors.white, fontSize: 11)),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Colors.white70),
                          padding: EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickImage(ImageSource.gallery),
                        icon: Icon(Icons.photo_library, color: Colors.white, size: 18),
                        label: Text("GALERIA", style: TextStyle(color: Colors.white, fontSize: 11)),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Colors.white70),
                          padding: EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              SizedBox(height: 10),
              
              ElevatedButton(
                onPressed: isSaving || cart.isEmpty ? null : _finishSale,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, minimumSize: Size(double.infinity, 50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                child: Text(isSaving ? "PROCESSANDO..." : "FINALIZAR VENDA", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              )
            ],
          ),
        )
      ],
    );
  }
}
