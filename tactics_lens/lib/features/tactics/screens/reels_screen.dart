import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../models/tactic_model.dart';
import '../providers/tactics_provider.dart';
import '../widgets/reel_player.dart';

class ReelsScreen extends ConsumerStatefulWidget {
  final List<TacticModel> tactics;
  final int initialIndex;

  const ReelsScreen({
    super.key,
    required this.tactics,
    this.initialIndex = 0,
  });

  @override
  ConsumerState<ReelsScreen> createState() => _ReelsScreenState();
}

class _ReelsScreenState extends ConsumerState<ReelsScreen> {
  late PageController _pageController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: widget.tactics.length,
            onPageChanged: (index) {
              setState(() => _currentIndex = index);
            },
            itemBuilder: (context, index) {
              return ReelPlayer(
                tactic: widget.tactics[index],
                isActive: index == _currentIndex,
              );
            },
          ),
          // Back button
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            child: GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.close_rounded,
                    color: Colors.white, size: 24),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
