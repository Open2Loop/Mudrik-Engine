import 'dart:io';
import 'package:camera/camera.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

class OcrService {
  TextRecognizer? _arabicRecognizer;
  TextRecognizer? _latinRecognizer;

  OcrService() {
    _arabicRecognizer = TextRecognizer(script: TextRecognitionScript.arabic);
    _latinRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
  }

  Future<String> recognizeFromFile(XFile file) async {
    final inputImage = InputImage.fromFilePath(file.path);
    return recognizeFromInputImage(inputImage);
  }

  Future<String> recognizeFromInputImage(InputImage inputImage) async {
    final results = await Future.wait([
      _arabicRecognizer!.processImage(inputImage),
      _latinRecognizer!.processImage(inputImage),
    ]);

    final arabicText = results[0];
    final latinText = results[1];

    final mergedBlocks = _mergeResults(arabicText, latinText);
    return mergedBlocks.join(' ');
  }

  List<String> _mergeResults(
      RecognizedText arabicResult, RecognizedText latinResult) {
    final allBlocks = <_TextBlockWithSource>[];

    for (final block in arabicResult.blocks) {
      allBlocks.add(_TextBlockWithSource(
        text: block.text,
        rect: block.boundingBox,
        source: 'arabic',
      ));
    }

    for (final block in latinResult.blocks) {
      final isDuplicate = allBlocks.any((existing) {
        return _overlaps(existing.rect, block.boundingBox);
      });
      if (!isDuplicate) {
        allBlocks.add(_TextBlockWithSource(
          text: block.text,
          rect: block.boundingBox,
          source: 'latin',
        ));
      }
    }

    // Sort RTL-aware: top to bottom, then right to left
    allBlocks.sort((a, b) {
      final yDiff = a.rect.top - b.rect.top;
      if (yDiff.abs() > 20) return yDiff.toInt();
      return b.rect.right.compareTo(a.rect.right);
    });

    return allBlocks.map((b) => b.text).toList();
  }

  bool _overlaps(Rect a, Rect b) {
    if (a.right < b.left || b.right < a.left) return false;
    if (a.bottom < b.top || b.bottom < a.top) return false;
    final intersection = a.intersect(b);
    final overlapArea = intersection.width * intersection.height;
    final minArea =
        (a.width * a.height).clamp(1, double.infinity).toDouble();
    return overlapArea / minArea > 0.5;
  }

  void dispose() {
    _arabicRecognizer?.close();
    _latinRecognizer?.close();
  }
}

class _TextBlockWithSource {
  final String text;
  final Rect rect;
  final String source;

  _TextBlockWithSource({
    required this.text,
    required this.rect,
    required this.source,
  });
}
