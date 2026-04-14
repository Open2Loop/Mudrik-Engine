import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../providers/scan_provider.dart';

class ScanProcessingScreen extends ConsumerStatefulWidget {
  final String scannedText;

  const ScanProcessingScreen({super.key, required this.scannedText});

  @override
  ConsumerState<ScanProcessingScreen> createState() =>
      _ScanProcessingScreenState();
}

class _ScanProcessingScreenState extends ConsumerState<ScanProcessingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startProcessing();
    });
  }

  Future<void> _startProcessing() async {
    final notifier = ref.read(scanStateProvider.notifier);
    await notifier.processText(widget.scannedText);

    if (!mounted) return;
    final state = ref.read(scanStateProvider);

    if (state.status == ScanStatus.done) {
      context.pushReplacement('/scan-result', extra: {
        'result': state.result,
        'scannedText': widget.scannedText,
      });
    } else if (state.status == ScanStatus.error) {
      context.pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(state.errorMessage ?? 'حدث خطأ')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final scanState = ref.watch(scanStateProvider);

    String statusText;
    switch (scanState.status) {
      case ScanStatus.extracting:
        statusText = 'جارٍ استخراج الكلمات المفتاحية...';
        break;
      case ScanStatus.matching:
        statusText = 'جارٍ البحث عن التكتيك المناسب...';
        break;
      default:
        statusText = 'جارٍ التحليل...';
    }

    return Scaffold(
      backgroundColor: GlassColors.background,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 120,
              height: 120,
              child: Shimmer.fromColors(
                baseColor: GlassColors.primaryAccent,
                highlightColor: GlassColors.secondaryAccent,
                child: Container(
                  decoration: BoxDecoration(
                    color: GlassColors.primaryAccent,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: const Icon(
                    Icons.auto_awesome_rounded,
                    size: 56,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            Text(statusText, style: GlassTypography.headline3),
            const SizedBox(height: 12),
            Text(
              'لحظات قليلة...',
              style: GlassTypography.bodySmall.copyWith(
                color: GlassColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
