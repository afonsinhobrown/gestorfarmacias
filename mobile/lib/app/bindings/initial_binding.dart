import 'package:get/get.dart';
import '../data/services/auth_service.dart';
import '../data/services/config_service.dart';

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(ConfigService(), permanent: true);
    Get.put(AuthService(), permanent: true);
  }
}
