import 'dart:ui';
import 'package:flutter/material.dart';

class GlassColors {
  static const Color background = Color(0xFF0A0E27);
  static const Color backgroundSecondary = Color(0xFF141937);
  static const Color primaryAccent = Color(0xFF6C63FF);
  static const Color secondaryAccent = Color(0xFF00D9FF);
  static const Color success = Color(0xFF00E676);
  static const Color warning = Color(0xFFFFD600);
  static const Color error = Color(0xFFFF5252);

  static Color glassSurface = Colors.white.withValues(alpha: 0.08);
  static Color glassBorder = Colors.white.withValues(alpha: 0.15);
  static Color glassHighlight = Colors.white.withValues(alpha: 0.20);
  static Color textPrimary = Colors.white;
  static Color textSecondary = Colors.white.withValues(alpha: 0.6);
  static Color textTertiary = Colors.white.withValues(alpha: 0.4);
}
