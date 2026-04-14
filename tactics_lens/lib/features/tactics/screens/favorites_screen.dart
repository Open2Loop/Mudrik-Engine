import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../../../core/widgets/glass_app_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../providers/tactics_provider.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favoritesAsync = ref.watch(favoriteTacticsProvider);

    return Scaffold(
      backgroundColor: GlassColors.background,
      appBar: const GlassAppBar(title: 'المفضّلة'),
      body: favoritesAsync.when(
        data: (tactics) {
          if (tactics.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.favorite_border_rounded,
                      size: 64, color: GlassColors.textTertiary),
                  const SizedBox(height: 16),
                  Text(
                    'لا توجد تكتيكات محفوظة',
                    style: GlassTypography.body.copyWith(
                      color: GlassColors.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: tactics.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final tactic = tactics[index];
              return GlassCard(
                onTap: () {
                  context.push('/reels', extra: {
                    'tactics': tactics,
                    'initialIndex': index,
                  });
                },
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: GlassColors.primaryAccent.withValues(alpha: 0.2),
                      ),
                      child: const Icon(Icons.play_circle_rounded,
                          color: GlassColors.primaryAccent, size: 32),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        tactic.title,
                        style: GlassTypography.body,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const Icon(Icons.chevron_left_rounded,
                        color: GlassColors.textTertiary),
                  ],
                ),
              );
            },
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: GlassColors.primaryAccent),
        ),
        error: (e, _) => Center(child: Text('خطأ: $e')),
      ),
    );
  }
}
