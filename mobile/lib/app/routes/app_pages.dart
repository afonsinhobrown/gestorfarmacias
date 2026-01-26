import 'package:get/get.dart';
import '../ui/pages/home_page/home_page.dart';
import '../ui/pages/login_page/login_page.dart';
import '../ui/pages/splash_page/splash_page.dart';
import '../ui/pages/register_page/register_page.dart';
import '../ui/pages/settings_page/settings_page.dart';

part 'app_routes.dart';

class AppPages {
  static const INITIAL = Routes.SPLASH;

  static final routes = [
    GetPage(
      name: Routes.SPLASH, 
      page: () => SplashPage(),
    ),
    GetPage(
      name: Routes.HOME, 
      page: () => HomePage(),
    ),
    GetPage(
      name: Routes.LOGIN, 
      page: () => LoginPage(),
    ),
    GetPage(
      name: Routes.REGISTER, 
      page: () => RegisterPage(),
    ),
    GetPage(
      name: Routes.SETTINGS, 
      page: () => SettingsPage(),
    ),
  ];
}
