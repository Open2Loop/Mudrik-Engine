import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../../../core/widgets/glass_card.dart';
import '../services/ai_category_suggester.dart';

class AiSuggestionCard extends StatelessWidget {
  final AiSuggestionResult suggestion;

  const AiSuggestionCard({super.key, required this.suggestion});

  Color get _confidenceColor {
    switch (suggestion.confidenceLevel) {
      case 'high':
        return GlassColors.success;
      case 'medium':
        return GlassColors.warning;
      default:
        return GlassColors.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: GlassColors.secondaryAccent.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.auto_awesome,
                            size: 14, color: GlassColors.secondaryAccent),
                        const SizedBox(width: 4),
                        Text(
                          'اقتراح ذكي',
                          style: GlassTypography.caption.copyWith(
                            color: GlassColors.secondaryAccent,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: _confidenceColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${(suggestion.confidence * 100).toInt()}%',
                    style: GlassTypography.caption.copyWith(
                      color: _confidenceColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'لم نجد تطابق دقيق، لكن نقترح لك تكتيكات قسم:',
                style: GlassTypography.bodySmall.copyWith(
                  color: GlassColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                suggestion.categoryName,
                style: GlassTypography.headline2.copyWith(
                  color: GlassColors.primaryAccent,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                suggestion.reasoning,
                style: GlassTypography.caption.copyWith(
                  color: GlassColors.textTertiary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'هذا اقتراح ذكي وقد لا يكون دقيقاً 100%',
                style: GlassTypography.caption.copyWith(
                  color: GlassColors.textTertiary,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'تكتيكات مقترحة من هذا القسم',
          style: GlassTypography.headline3,
        ),
        const SizedBox(height: 12),
      ],
    );
  }
}
