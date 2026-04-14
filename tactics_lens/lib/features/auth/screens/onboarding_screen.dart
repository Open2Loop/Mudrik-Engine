import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/glass_colors.dart';
import '../../../core/theme/glass_typography.dart';
import '../../../core/widgets/glass_button.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _currentPage = 0;

  final _pages = const [
    _OnboardingPage(
      icon: Icons.camera_alt_rounded,
      title: 'وجّه الكاميرا',
      description: 'صوّب كاميرا جوالك على أي سؤال صعب في القدرات أو التحصيلي',
    ),
    _OnboardingPage(
      icon: Icons.auto_awesome_rounded,
      title: 'تعرّف فوري',
      description: 'التطبيق يتعرف على السؤال ويطابقه مع التكتيك المناسب خلال ثوانٍ',
    ),
    _OnboardingPage(
      icon: Icons.play_circle_rounded,
      title: 'شاهد التكتيك',
      description: 'فيديو قصير يشرح لك الطريقة الذهبية لحل هذا النوع من الأسئلة',
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GlassColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (i) => setState(() => _currentPage = i),
                itemBuilder: (context, i) => _pages[i],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _pages.length,
                      (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: _currentPage == i ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _currentPage == i
                              ? GlassColors.primaryAccent
                              : GlassColors.textTertiary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  GlassButton(
                    label: _currentPage == _pages.length - 1
                        ? 'ابدأ الآن'
                        : 'التالي',
                    width: double.infinity,
                    onPressed: () {
                      if (_currentPage == _pages.length - 1) {
                        context.go('/login');
                      } else {
                        _controller.nextPage(
                          duration: const Duration(milliseconds: 400),
                          curve: Curves.easeInOutCubic,
                        );
                      }
                    },
                  ),
                  if (_currentPage < _pages.length - 1) ...[
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: Text(
                        'تخطّي',
                        style: GlassTypography.bodySmall.copyWith(
                          color: GlassColors.textTertiary,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _OnboardingPage({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: GlassColors.primaryAccent.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Icon(icon, color: GlassColors.primaryAccent, size: 56),
          ),
          const SizedBox(height: 40),
          Text(title, style: GlassTypography.headline2, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          Text(
            description,
            style: GlassTypography.body.copyWith(color: GlassColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
