import 'dart:async';
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../config/app_constants.dart';
import '../../tactics/models/tactic_model.dart';

class AiSuggestionResult {
  final String categoryId;
  final String categoryName;
  final double confidence;
  final String reasoning;
  final List<TacticModel> suggestedTactics;

  const AiSuggestionResult({
    required this.categoryId,
    required this.categoryName,
    required this.confidence,
    required this.reasoning,
    required this.suggestedTactics,
  });

  factory AiSuggestionResult.fromJson(Map<String, dynamic> json) {
    final tactics = (json['tactics'] as List?)
            ?.map((t) => TacticModel.fromJson(t as Map<String, dynamic>))
            .toList() ??
        [];

    return AiSuggestionResult(
      categoryId: json['category_id'] as String,
      categoryName: json['category_name'] as String,
      confidence: (json['confidence'] as num).toDouble(),
      reasoning: json['reasoning'] as String,
      suggestedTactics: tactics,
    );
  }

  String get confidenceLevel {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }
}

class AiCategorySuggester {
  final _supabase = Supabase.instance.client;

  Future<AiSuggestionResult?> suggest(String rawText) async {
    try {
      final response = await _supabase.functions
          .invoke(
            'tl-ai-suggest-category',
            body: {'raw_text': rawText},
          )
          .timeout(AppConstants.aiSuggestionTimeout);

      if (response.status != 200) return null;

      final data = response.data as Map<String, dynamic>;
      if (data['fallback'] == true) return null;

      return AiSuggestionResult.fromJson(data);
    } on TimeoutException {
      return null;
    } catch (_) {
      return null;
    }
  }
}
