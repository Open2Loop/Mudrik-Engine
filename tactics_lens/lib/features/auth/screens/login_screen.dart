import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../../../core/widgets/glass_button.dart';
import '../../../core/widgets/glass_card.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      backgroundColor: GlassColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [GlassColors.primaryAccent, GlassColors.secondaryAccent],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.camera_enhance_rounded,
                  color: Colors.white,
                  size: 40,
                ),
              ),
              const SizedBox(height: 24),
              const Text('عدسة التكتيكات', style: GlassTypography.headline2),
              const SizedBox(height: 8),
              Text(
                'سجّل دخولك للبدء',
                style: GlassTypography.body.copyWith(
                  color: GlassColors.textSecondary,
                ),
              ),
              const SizedBox(height: 48),
              GlassCard(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    GlassButton(
                      label: 'تسجيل بـ Apple',
                      icon: Icons.apple_rounded,
                      width: double.infinity,
                      isLoading: authState.isLoading,
                      onPressed: () {
                        ref.read(authNotifierProvider.notifier).signInWithApple();
                      },
                    ),
                    const SizedBox(height: 16),
                    GlassButton(
                      label: 'تسجيل بـ Google',
                      icon: Icons.g_mobiledata_rounded,
                      isPrimary: false,
                      width: double.infinity,
                      isLoading: authState.isLoading,
                      onPressed: () {
                        ref.read(authNotifierProvider.notifier).signInWithGoogle();
                      },
                    ),
                  ],
                ),
              ),
              if (authState.hasError) ...[
                const SizedBox(height: 16),
                Text(
                  'حدث خطأ، حاول مرة أخرى',
                  style: GlassTypography.caption.copyWith(
                    color: GlassColors.error,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
