import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../models/tactic_model.dart';
import '../providers/tactics_provider.dart';

class ReelPlayer extends ConsumerStatefulWidget {
  final TacticModel tactic;
  final bool isActive;

  const ReelPlayer({
    super.key,
    required this.tactic,
    required this.isActive,
  });

  @override
  ConsumerState<ReelPlayer> createState() => _ReelPlayerState();
}

class _ReelPlayerState extends ConsumerState<ReelPlayer> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _isPlaying = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  Future<void> _initVideo() async {
    try {
      final signedUrlService = ref.read(signedUrlServiceProvider);
      final url = await signedUrlService.getSignedUrl(widget.tactic.id);

      _controller = VideoPlayerController.networkUrl(Uri.parse(url));
      await _controller!.initialize();
      _controller!.setLooping(true);

      if (mounted) {
        setState(() => _isInitialized = true);
        if (widget.isActive) {
          _controller!.play();
          setState(() => _isPlaying = true);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _hasError = true);
      }
    }
  }

  @override
  void didUpdateWidget(covariant ReelPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        _controller?.play();
        setState(() => _isPlaying = true);
      } else {
        _controller?.pause();
        setState(() => _isPlaying = false);
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _togglePlayPause() {
    if (_controller == null) return;
    if (_isPlaying) {
      _controller!.pause();
    } else {
      _controller!.play();
    }
    setState(() => _isPlaying = !_isPlaying);
  }

  @override
  Widget build(BuildContext context) {
    final favorites = ref.watch(favoriteNotifierProvider);
    final isFav = favorites.contains(widget.tactic.id);

    return GestureDetector(
      onTap: _togglePlayPause,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video
          if (_isInitialized && _controller != null)
            Center(
              child: AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: VideoPlayer(_controller!),
              ),
            )
          else if (_hasError)
            const Center(
              child: Icon(Icons.error_outline, color: Colors.white54, size: 48),
            )
          else
            const Center(
              child: CircularProgressIndicator(color: GlassColors.primaryAccent),
            ),

          // Play/Pause overlay
          if (!_isPlaying && _isInitialized)
            const Center(
              child: Icon(Icons.play_arrow_rounded,
                  color: Colors.white54, size: 72),
            ),

          // Bottom info overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 40, 16, 40),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.8),
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.tactic.title,
                    style: GlassTypography.headline3,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (widget.tactic.description != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      widget.tactic.description!,
                      style: GlassTypography.bodySmall.copyWith(
                        color: GlassColors.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Right-side action buttons
          Positioned(
            right: 16,
            bottom: 120,
            child: Column(
              children: [
                _ActionButton(
                  icon: isFav ? Icons.favorite : Icons.favorite_border,
                  color: isFav ? GlassColors.error : Colors.white,
                  onTap: () {
                    ref
                        .read(favoriteNotifierProvider.notifier)
                        .toggle(widget.tactic.id);
                  },
                ),
                const SizedBox(height: 20),
                _ActionButton(
                  icon: Icons.share_rounded,
                  onTap: () {
                    // TODO: Share functionality
                  },
                ),
              ],
            ),
          ),

          // Progress bar
          if (_isInitialized && _controller != null)
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              left: 16,
              right: 16,
              child: VideoProgressIndicator(
                _controller!,
                allowScrubbing: true,
                colors: const VideoProgressColors(
                  playedColor: GlassColors.primaryAccent,
                  bufferedColor: Colors.white24,
                  backgroundColor: Colors.white12,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    this.color = Colors.white,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(icon, color: color, size: 28),
      ),
    );
  }
}
