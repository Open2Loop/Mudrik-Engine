class ArabicNormalizer {
  static const List<String> _stopWords = [
    'في', 'من', 'الى', 'على', 'عن', 'مع', 'هل', 'هو', 'هي',
    'هم', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'الذين',
    'اذا', 'اذ', 'كان', 'كانت', 'يكون', 'ان', 'انه', 'لا', 'لم',
    'لن', 'قد', 'ما', 'او', 'ثم', 'بل', 'لكن', 'حتى', 'بين',
    'كل', 'بعض', 'غير', 'عند', 'منذ', 'خلال', 'حيث', 'كيف',
    'لماذا', 'متى', 'اين', 'اي', 'بعد', 'قبل', 'فوق', 'تحت',
    'وهو', 'وهي', 'فان', 'فهو', 'وان', 'ولا', 'ولم', 'فلا',
    'ولكن', 'وقد', 'وما', 'فما', 'بما', 'مما', 'لما', 'عما',
    'كما', 'اما', 'نحو', 'ضمن', 'يعني', 'اخرى', 'اخر', 'ايضا',
    'بسبب', 'حول', 'دون', 'سوى', 'فقط', 'لدى', 'احد', 'كثير',
  ];

  static final RegExp _tashkeelRegex = RegExp(
    '[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]',
  );

  static String normalize(String text) {
    var result = text;
    result = _removeTashkeel(result);
    result = _normalizeAlif(result);
    result = _normalizeYaa(result);
    result = _normalizeTaaMarbuta(result);
    result = _normalizeHamza(result);
    return result.trim();
  }

  static String _removeTashkeel(String text) {
    return text.replaceAll(_tashkeelRegex, '');
  }

  static String _normalizeAlif(String text) {
    return text
        .replaceAll('أ', 'ا')
        .replaceAll('إ', 'ا')
        .replaceAll('آ', 'ا');
  }

  static String _normalizeYaa(String text) {
    return text.replaceAll('ى', 'ي');
  }

  static String _normalizeTaaMarbuta(String text) {
    return text.replaceAll('ة', 'ه');
  }

  static String _normalizeHamza(String text) {
    return text.replaceAll('ؤ', 'و').replaceAll('ئ', 'ي');
  }

  static List<String> extractKeywords(String text) {
    final normalized = normalize(text);
    final words = normalized.split(RegExp(r'[\s\u200B-\u200D\uFEFF]+'));
    return words
        .where((w) => w.length > 1)
        .where((w) => !_stopWords.contains(w))
        .where((w) => !RegExp(r'^[\d\+\-\*\/\=\(\)\.\,\;\:\!\?]+$').hasMatch(w))
        .toList();
  }

  static List<String> extractMathTokens(String text) {
    final matches = RegExp(r'[\d]+[سx]|[سx][\d]*|[\d]+').allMatches(text);
    return matches.map((m) => m.group(0)!).toList();
  }
}
