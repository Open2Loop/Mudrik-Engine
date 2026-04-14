import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/scanner/screens/scanner_screen.dart';
import '../../features/scanner/screens/scan_processing_screen.dart';
import '../../features/scanner/screens/scan_result_screen.dart';
import '../../features/tactics/screens/reels_screen.dart';
import '../../features/tactics/screens/library_screen.dart';
import '../../features/tactics/screens/category_screen.dart';
import '../../features/tactics/screens/favorites_screen.dart';
import '../../features/subscriptions/screens/paywall_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/settings_screen.dart';
import '../widgets/glass_bottom_nav.dart';
import '../theme/glass_colors.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final session = Supabase.instance.client.auth.currentSession;
      final isAuth = session != null;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/onboarding' ||
          state.matchedLocation == '/splash';

      if (!isAuth && !isAuthRoute) return '/login';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => _ShellScaffold(child: child),
        routes: [
          GoRoute(
            path: '/scanner',
            builder: (context, state) => const ScannerScreen(),
          ),
          GoRoute(
            path: '/library',
            builder: (context, state) => const LibraryScreen(),
          ),
          GoRoute(
            path: '/favorites',
            builder: (context, state) => const FavoritesScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/scan-processing',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final text = state.extra as String;
          return ScanProcessingScreen(scannedText: text);
        },
      ),
      GoRoute(
        path: '/scan-result',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final data = state.extra as Map<String, dynamic>;
          return ScanResultScreen(resultData: data);
        },
      ),
      GoRoute(
        path: '/reels',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final data = state.extra as Map<String, dynamic>;
          return ReelsScreen(
            tactics: data['tactics'],
            initialIndex: data['initialIndex'] ?? 0,
          );
        },
      ),
      GoRoute(
        path: '/category/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          return CategoryScreen(categoryId: state.pathParameters['id']!);
        },
      ),
      GoRoute(
        path: '/paywall',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const PaywallScreen(),
      ),
      GoRoute(
        path: '/settings',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
});

class _ShellScaffold extends StatefulWidget {
  final Widget child;
  const _ShellScaffold({required this.child});

  @override
  State<_ShellScaffold> createState() => _ShellScaffoldState();
}

class _ShellScaffoldState extends State<_ShellScaffold> {
  int _currentIndex = 0;

  static const _routes = ['/scanner', '/library', '/favorites', '/profile'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GlassColors.background,
      body: widget.child,
      bottomNavigationBar: GlassBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
          context.go(_routes[index]);
        },
      ),
    );
  }
}
