import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import '../models/user_model.dart';

class AuthService extends GetxService {
  final _box = GetStorage();
  final Rx<User?> user = Rx<User?>(null);
  final RxBool isLoggedIn = false.obs;

  @override
  void onInit() {
    super.onInit();
    // Tenta restaurar sessão ao iniciar
    final storedUser = _box.read('user');
    final token = _box.read('token');
    
    if (storedUser != null && token != null) {
      user.value = User.fromJson(storedUser);
      isLoggedIn.value = true;
    }
  }

  void login(User newUser, String token) {
    user.value = newUser;
    isLoggedIn.value = true;
    _box.write('user', newUser.toJson());
    _box.write('token', token);
  }

  void logout() {
    user.value = null;
    isLoggedIn.value = false;
    _box.remove('user');
    _box.remove('token');
    // Navegar para login se necessário
  }
}
