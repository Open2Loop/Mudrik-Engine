import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../../../core/widgets/glass_app_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../providers/tactics_provider.dart';

class CategoryScreen extends ConsumerWidget {
  final String categoryId;

  const CategoryScreen({super.key, required this.categoryId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tacticsAsync = ref.watch(tacticsByCategoryProvider(categoryId));

    return Scaffold(
      backgroundColor: GlassColors.background,
      appBar: const GlassAppBar(title: 'التكتيكات', showBack: true),
      body: tacticsAsync.when(
        data: (tactics) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: tactics.length,
          itemBuilder: (context, index) {
            final tactic = tactics[index];
            return GlassCard(
              padding: const EdgeInsets.all(12),
              onTap: () {
                context.push('/reels', extra: {
                  'tactics': tactics,
                  'initialIndex': index,
                });
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: GlassColors.primaryAccent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Icon(Icons.play_circle_rounded,
                            color: GlassColors.primaryAccent, size: 40),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    tactic.title,
                    style: GlassTypography.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.visibility_rounded,
                          size: 14, color: GlassColors.textTertiary),
                      const SizedBox(width: 4),
                      Text(
                        '${tactic.viewCount}',
                        style: GlassTypography.caption.copyWith(
                          color: GlassColors.textTertiary,
                        ),
                      ),
                      if (tactic.isFree) ...[
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: GlassColors.success.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'مجاني',
                            style: GlassTypography.caption.copyWith(
                              color: GlassColors.success,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            );
          },
        ),
        loading: () => const Center(
          child: CircularProgressIndicator(color: GlassColors.primaryAccent),
        ),
        error: (e, _) => Center(child: Text('خطأ: $e')),
      ),
    );
  }
}
