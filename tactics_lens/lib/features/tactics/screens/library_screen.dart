import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../../../core/widgets/glass_app_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../providers/tactics_provider.dart';

class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: GlassColors.background,
      appBar: const GlassAppBar(title: 'المكتبة'),
      body: categoriesAsync.when(
        data: (categories) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: categories.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final cat = categories[index];
            return GlassCard(
              onTap: () => context.push('/category/${cat.id}'),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: GlassColors.primaryAccent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.folder_rounded,
                      color: GlassColors.primaryAccent,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(cat.name, style: GlassTypography.body),
                        Text(
                          cat.examType == 'qudurat' ? 'قدرات' : 'تحصيلي',
                          style: GlassTypography.caption.copyWith(
                            color: GlassColors.textTertiary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_left_rounded,
                      color: GlassColors.textTertiary),
                ],
              ),
            );
          },
        ),
        loading: () => const Center(
          child: CircularProgressIndicator(color: GlassColors.primaryAccent),
        ),
        error: (e, _) => Center(
          child: Text('خطأ: $e',
              style: GlassTypography.body.copyWith(color: GlassColors.error)),
        ),
      ),
    );
  }
}
