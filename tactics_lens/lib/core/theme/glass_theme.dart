import 'package:flutter/material.dart';
import 'glass_colors.dart';
import 'glass_typography.dart';

class GlassTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: GlassColors.background,
      fontFamily: 'IBMPlexSansArabic',
      colorScheme: const ColorScheme.dark(
        primary: GlassColors.primaryAccent,
        secondary: GlassColors.secondaryAccent,
        surface: GlassColors.backgroundSecondary,
        error: GlassColors.error,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GlassTypography.headline3,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: GlassColors.backgroundSecondary.withValues(alpha: 0.8),
        selectedItemColor: GlassColors.primaryAccent,
        unselectedItemColor: GlassColors.textTertiary,
        type: BottomNavigationBarType.fixed,
      ),
      textTheme: const TextTheme(
        displayLarge: GlassTypography.headline1,
        displayMedium: GlassTypography.headline2,
        displaySmall: GlassTypography.headline3,
        bodyLarge: GlassTypography.body,
        bodyMedium: GlassTypography.bodySmall,
        bodySmall: GlassTypography.caption,
        labelLarge: GlassTypography.button,
      ),
    );
  }
}
