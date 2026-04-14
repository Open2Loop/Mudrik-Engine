import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/glass_colors.dart';
import '../theme/glass_typography.dart';

class GlassAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool showBack;

  const GlassAppBar({
    super.key,
    required this.title,
    this.actions,
    this.showBack = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: AppBar(
          backgroundColor: GlassColors.backgroundSecondary.withValues(alpha: 0.7),
          leading: showBack
              ? IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                )
              : null,
          title: Text(title, style: GlassTypography.headline3),
          actions: actions,
          elevation: 0,
        ),
      ),
    );
  }
}
