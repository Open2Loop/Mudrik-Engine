import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/glass_colors.dart';

class ScanOverlay extends StatelessWidget {
  const ScanOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _ScanOverlayPainter(),
      child: const SizedBox.expand(),
    );
  }
}

class _ScanOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final scanRect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height / 2 - 40),
      width: size.width * 0.85,
      height: size.height * 0.35,
    );

    // Dim area outside scan rect
    final dimPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.5)
      ..style = PaintingStyle.fill;

    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height)),
        Path()
          ..addRRect(
              RRect.fromRectAndRadius(scanRect, const Radius.circular(16))),
      ),
      dimPaint,
    );

    // Glass border
    final borderPaint = Paint()
      ..color = GlassColors.primaryAccent.withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawRRect(
      RRect.fromRectAndRadius(scanRect, const Radius.circular(16)),
      borderPaint,
    );

    // Corner accents
    final cornerPaint = Paint()
      ..color = GlassColors.primaryAccent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    const cornerLen = 24.0;
    final r = scanRect;

    // Top-left
    canvas.drawLine(r.topLeft + const Offset(0, 16), r.topLeft + Offset(0, 16 + cornerLen), cornerPaint);
    canvas.drawLine(r.topLeft + const Offset(16, 0), r.topLeft + Offset(16 + cornerLen, 0), cornerPaint);
    // Top-right
    canvas.drawLine(r.topRight + const Offset(0, 16), r.topRight + Offset(0, 16 + cornerLen), cornerPaint);
    canvas.drawLine(r.topRight + const Offset(-16, 0), r.topRight + Offset(-16 - cornerLen, 0), cornerPaint);
    // Bottom-left
    canvas.drawLine(r.bottomLeft + const Offset(0, -16), r.bottomLeft + Offset(0, -16 - cornerLen), cornerPaint);
    canvas.drawLine(r.bottomLeft + const Offset(16, 0), r.bottomLeft + Offset(16 + cornerLen, 0), cornerPaint);
    // Bottom-right
    canvas.drawLine(r.bottomRight + const Offset(0, -16), r.bottomRight + Offset(0, -16 - cornerLen), cornerPaint);
    canvas.drawLine(r.bottomRight + const Offset(-16, 0), r.bottomRight + Offset(-16 - cornerLen, 0), cornerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
