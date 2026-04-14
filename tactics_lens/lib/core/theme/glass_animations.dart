import 'package:flutter/material.dart';

class GlassAnimations {
  static const Duration pageTransition = Duration(milliseconds: 400);
  static const Duration cardAppear = Duration(milliseconds: 300);
  static const Duration scanPulse = Duration(milliseconds: 1500);
  static const Duration shimmerLoop = Duration(milliseconds: 2000);
  static const Duration resultAppear = Duration(milliseconds: 500);
  static const Duration tapFeedback = Duration(milliseconds: 100);
  static const Duration reelTransition = Duration(milliseconds: 300);
  static const Duration glassBlurEntry = Duration(milliseconds: 600);

  static const Curve pageTransitionCurve = Curves.easeInOutCubic;
  static const Curve cardAppearCurve = Curves.easeOut;
  static const Curve scanPulseCurve = Curves.easeInOut;
  static const Curve resultAppearCurve = Curves.elasticOut;
  static const Curve tapFeedbackCurve = Curves.easeIn;
  static const Curve reelTransitionCurve = Cubic(0.25, 1.0, 0.5, 1.0);
  static const Curve glassBlurCurve = Curves.easeOut;
}
