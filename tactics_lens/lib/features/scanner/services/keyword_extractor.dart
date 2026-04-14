import '../../../core/utils/arabic_normalizer.dart';

class KeywordExtractor {
  static const Map<String, double> _mathTerms = {
    'معادله': 3.0, 'معادلة': 3.0, 'نسبه': 3.0, 'نسبة': 3.0,
    'مثلث': 3.0, 'دائره': 3.0, 'دائرة': 3.0, 'مربع': 3.0,
    'مستطيل': 3.0, 'احتمال': 3.0, 'متوسط': 3.0, 'وسيط': 3.0,
    'انحراف': 3.0, 'تباين': 3.0, 'جذر': 3.0, 'اس': 3.0,
    'لوغاريتم': 3.0, 'مصفوفه': 3.0, 'مصفوفة': 3.0, 'متتاليه': 3.0,
    'متتالية': 3.0, 'تكامل': 3.0, 'مشتقه': 3.0, 'مشتقة': 3.0,
    'زاويه': 3.0, 'زاوية': 3.0, 'محيط': 3.0, 'مساحه': 3.0,
    'مساحة': 3.0, 'حجم': 3.0, 'كسر': 3.0, 'عشري': 3.0,
  };

  static const Map<String, String> _questionPatterns = {
    'اوجد قيمه': 'solve_for_value',
    'اوجد قيمة': 'solve_for_value',
    'ما قيمه': 'solve_for_value',
    'ما قيمة': 'solve_for_value',
    'ما النسبه': 'ratio',
    'ما النسبة': 'ratio',
    'كم عدد': 'counting',
    'كم يبلغ': 'counting',
    'قارن بين': 'comparison',
    'رتب': 'ordering',
    'اختر الاجابه': 'multiple_choice',
    'اختر الاجابة': 'multiple_choice',
    'اذا كان': 'conditional',
  };

  static const Map<String, double> _subjectTerms = {
    'جبر': 2.0, 'هندسه': 2.0, 'هندسة': 2.0, 'احصاء': 2.0,
    'حساب': 2.0, 'تحليل': 2.0, 'تناسب': 2.0, 'نسب': 2.0,
    'هندسيه': 2.0, 'هندسية': 2.0, 'لفظي': 2.0, 'استيعاب': 2.0,
    'تناظر': 2.0, 'اكمال': 2.0, 'خطا': 2.0, 'سياقي': 2.0,
  };

  static KeywordExtractionResult extract(String rawText) {
    final normalized = ArabicNormalizer.normalize(rawText);
    final keywords = ArabicNormalizer.extractKeywords(rawText);
    final mathTokens = ArabicNormalizer.extractMathTokens(rawText);

    final weightedKeywords = <WeightedKeyword>[];

    for (final kw in keywords) {
      final normalizedKw = ArabicNormalizer.normalize(kw);
      double weight = 1.0;

      if (_mathTerms.containsKey(normalizedKw)) {
        weight = _mathTerms[normalizedKw]!;
      } else if (_subjectTerms.containsKey(normalizedKw)) {
        weight = _subjectTerms[normalizedKw]!;
      }

      weightedKeywords.add(WeightedKeyword(keyword: normalizedKw, weight: weight));
    }

    String? detectedPattern;
    for (final entry in _questionPatterns.entries) {
      if (normalized.contains(entry.key)) {
        detectedPattern = entry.value;
        weightedKeywords.add(
          WeightedKeyword(keyword: entry.value, weight: 2.5),
        );
        break;
      }
    }

    return KeywordExtractionResult(
      keywords: weightedKeywords,
      mathTokens: mathTokens,
      detectedPattern: detectedPattern,
      normalizedText: normalized,
    );
  }
}

class WeightedKeyword {
  final String keyword;
  final double weight;

  const WeightedKeyword({required this.keyword, required this.weight});
}

class KeywordExtractionResult {
  final List<WeightedKeyword> keywords;
  final List<String> mathTokens;
  final String? detectedPattern;
  final String normalizedText;

  const KeywordExtractionResult({
    required this.keywords,
    required this.mathTokens,
    this.detectedPattern,
    required this.normalizedText,
  });

  List<String> get keywordStrings => keywords.map((k) => k.keyword).toList();
}
