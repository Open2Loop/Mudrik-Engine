import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../features/tactics/models/tactic_model.dart';
import 'keyword_extractor.dart';
import 'ai_category_suggester.dart';

class MatchResult {
  final List<TacticModel> tactics;
  final double topScore;
  final String matchMethod;
  final AiSuggestionResult? aiSuggestion;

  const MatchResult({
    required this.tactics,
    required this.topScore,
    required this.matchMethod,
    this.aiSuggestion,
  });
}

class TacticMatcher {
  final _supabase = Supabase.instance.client;
  final AiCategorySuggester _aiSuggester = AiCategorySuggester();

  Future<MatchResult> match(
    KeywordExtractionResult extraction, {
    bool allowAiFallback = true,
  }) async {
    // Stage 1: Exact keyword match via RPC
    final keywordStrings = extraction.keywordStrings;
    if (keywordStrings.isEmpty) {
      return _handleNoResults(extraction, allowAiFallback);
    }

    final exactResults = await _supabase.rpc('tl_match_tactics', params: {
      'p_keywords': keywordStrings,
    });

    final tactics = _parseTactics(exactResults as List);

    if (tactics.length >= 3) {
      return MatchResult(
        tactics: tactics,
        topScore: _getTopScore(exactResults),
        matchMethod: 'keyword',
      );
    }

    // Stage 2: Fuzzy match
    final fuzzyResults = await _supabase.rpc('tl_fuzzy_match_keywords', params: {
      'p_text': extraction.normalizedText,
      'p_threshold': 0.3,
    });

    final fuzzyTactics = _parseTactics(fuzzyResults as List);
    final combined = _mergeTactics(tactics, fuzzyTactics);

    if (combined.isNotEmpty) {
      return MatchResult(
        tactics: combined,
        topScore: _getTopScore(fuzzyResults),
        matchMethod: 'fuzzy',
      );
    }

    // Stage 3: AI Fallback
    return _handleNoResults(extraction, allowAiFallback);
  }

  Future<MatchResult> _handleNoResults(
    KeywordExtractionResult extraction,
    bool allowAiFallback,
  ) async {
    if (!allowAiFallback) {
      return const MatchResult(
        tactics: [],
        topScore: 0,
        matchMethod: 'none',
      );
    }

    try {
      final aiResult = await _aiSuggester.suggest(extraction.normalizedText);
      if (aiResult != null) {
        return MatchResult(
          tactics: aiResult.suggestedTactics,
          topScore: aiResult.confidence,
          matchMethod: 'ai_fallback',
          aiSuggestion: aiResult,
        );
      }
    } catch (_) {}

    return const MatchResult(
      tactics: [],
      topScore: 0,
      matchMethod: 'none',
    );
  }

  List<TacticModel> _parseTactics(List results) {
    return results.map((r) {
      return TacticModel(
        id: r['tactic_id'] as String,
        categoryId: '',
        title: r['title'] as String,
        videoUrl: r['video_url'] as String,
        thumbnailUrl: r['thumbnail_url'] as String,
        createdAt: DateTime.now(),
      );
    }).toList();
  }

  double _getTopScore(List results) {
    if (results.isEmpty) return 0;
    final score = results.first['score'] ?? results.first['similarity'] ?? 0;
    return (score as num).toDouble();
  }

  List<TacticModel> _mergeTactics(
      List<TacticModel> a, List<TacticModel> b) {
    final ids = a.map((t) => t.id).toSet();
    final merged = [...a];
    for (final t in b) {
      if (!ids.contains(t.id)) {
        merged.add(t);
        ids.add(t.id);
      }
    }
    return merged;
  }
}
