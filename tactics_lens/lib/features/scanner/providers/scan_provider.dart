import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/ocr_service.dart';
import '../services/keyword_extractor.dart';
import '../services/tactic_matcher.dart';

final ocrServiceProvider = Provider<OcrService>((ref) {
  final service = OcrService();
  ref.onDispose(() => service.dispose());
  return service;
});

final tacticMatcherProvider = Provider<TacticMatcher>((ref) {
  return TacticMatcher();
});

final scanStateProvider =
    StateNotifierProvider<ScanNotifier, ScanState>((ref) {
  return ScanNotifier(ref);
});

enum ScanStatus { idle, scanning, extracting, matching, done, error }

class ScanState {
  final ScanStatus status;
  final String? scannedText;
  final MatchResult? result;
  final String? errorMessage;

  const ScanState({
    this.status = ScanStatus.idle,
    this.scannedText,
    this.result,
    this.errorMessage,
  });

  ScanState copyWith({
    ScanStatus? status,
    String? scannedText,
    MatchResult? result,
    String? errorMessage,
  }) {
    return ScanState(
      status: status ?? this.status,
      scannedText: scannedText ?? this.scannedText,
      result: result ?? this.result,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class ScanNotifier extends StateNotifier<ScanState> {
  final Ref _ref;

  ScanNotifier(this._ref) : super(const ScanState());

  Future<void> processText(String rawText) async {
    state = state.copyWith(
      status: ScanStatus.extracting,
      scannedText: rawText,
    );

    try {
      final extraction = KeywordExtractor.extract(rawText);

      state = state.copyWith(status: ScanStatus.matching);

      final matcher = _ref.read(tacticMatcherProvider);
      final result = await matcher.match(extraction);

      state = state.copyWith(
        status: ScanStatus.done,
        result: result,
      );
    } catch (e) {
      state = state.copyWith(
        status: ScanStatus.error,
        errorMessage: e.toString(),
      );
    }
  }

  void reset() {
    state = const ScanState();
  }
}
