import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../providers/scan_provider.dart';
import '../widgets/scan_overlay.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  CameraController? _cameraController;
  bool _isInitialized = false;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) return;

    _cameraController = CameraController(
      cameras.first,
      ResolutionPreset.high,
      enableAudio: false,
    );

    await _cameraController!.initialize();
    if (mounted) {
      setState(() => _isInitialized = true);
    }
  }

  Future<void> _captureAndScan() async {
    if (_isProcessing || _cameraController == null) return;
    setState(() => _isProcessing = true);

    try {
      final image = await _cameraController!.takePicture();
      final ocrService = ref.read(ocrServiceProvider);
      final text = await ocrService.recognizeFromFile(image);

      if (text.trim().isNotEmpty && mounted) {
        context.push('/scan-processing', extra: text);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('لم يتم التعرف على نص، حاول مرة أخرى')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GlassColors.background,
      body: Stack(
        children: [
          if (_isInitialized && _cameraController != null)
            Positioned.fill(
              child: CameraPreview(_cameraController!),
            )
          else
            const Center(
              child: CircularProgressIndicator(
                color: GlassColors.primaryAccent,
              ),
            ),
          const Positioned.fill(child: ScanOverlay()),
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'وجّه الكاميرا على السؤال',
                style: GlassTypography.body.copyWith(
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: GestureDetector(
                onTap: _isProcessing ? null : _captureAndScan,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [
                        GlassColors.primaryAccent,
                        GlassColors.secondaryAccent,
                      ],
                    ),
                    border: Border.all(color: Colors.white, width: 3),
                  ),
                  child: _isProcessing
                      ? const Padding(
                          padding: EdgeInsets.all(20),
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(
                          Icons.camera_alt_rounded,
                          color: Colors.white,
                          size: 32,
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
