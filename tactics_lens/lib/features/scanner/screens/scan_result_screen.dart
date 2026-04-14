import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/glass_app_bar.dart';
import '../../../core/widgets/glass_button.dart';
import '../services/tactic_matcher.dart';
import '../widgets/ai_suggestion_card.dart';

class ScanResultScreen extends ConsumerWidget {
  final Map<String, dynamic> resultData;

  const ScanResultScreen({super.key, required this.resultData});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final result = resultData['result'] as MatchResult;

    return Scaffold(
      backgroundColor: GlassColors.background,
      appBar: const GlassAppBar(title: 'نتائج المسح', showBack: true),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: result.tactics.isEmpty
              ? _buildNoResults(context)
              : _buildResults(context, result),
        ),
      ),
    );
  }

  Widget _buildResults(BuildContext context, MatchResult result) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (result.matchMethod == 'ai_fallback' && result.aiSuggestion != null)
          AiSuggestionCard(suggestion: result.aiSuggestion!),
        if (result.matchMethod != 'ai_fallback')
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(
              'التكتيكات المطابقة (${result.tactics.length})',
              style: GlassTypography.headline3,
            ),
          ),
        Expanded(
          child: ListView.separated(
            itemCount: result.tactics.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final tactic = result.tactics[index];
              return GlassCard(
                onTap: () {
                  context.push('/reels', extra: {
                    'tactics': result.tactics,
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
                      child: const Icon(
                        Icons.play_circle_rounded,
                        color: GlassColors.primaryAccent,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tactic.title,
                            style: GlassTypography.body,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (tactic.description != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              tactic.description!,
                              style: GlassTypography.caption.copyWith(
                                color: GlassColors.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_left_rounded,
                      color: GlassColors.primaryAccent,
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildNoResults(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.search_off_rounded,
            size: 64,
            color: GlassColors.textTertiary,
          ),
          const SizedBox(height: 16),
          Text(
            'لم نجد تكتيكات مطابقة',
            style: GlassTypography.headline3.copyWith(
              color: GlassColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'جرّب تصوير السؤال بوضوح أكبر أو تصفّح المكتبة',
            style: GlassTypography.bodySmall.copyWith(
              color: GlassColors.textTertiary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          GlassButton(
            label: 'تصفّح المكتبة',
            icon: Icons.library_books_rounded,
            onPressed: () => context.go('/library'),
          ),
        ],
      ),
    );
  }
}
