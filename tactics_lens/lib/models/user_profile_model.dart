class UserProfileModel {
  final String id;
  final String? displayName;
  final String examType;
  final int totalScans;
  final String subscriptionTier;
  final DateTime? subscriptionExpiresAt;
  final String? revenuecatId;
  final DateTime? examDate;
  final bool notificationsEnabled;

  const UserProfileModel({
    required this.id,
    this.displayName,
    this.examType = 'qudurat',
    this.totalScans = 0,
    this.subscriptionTier = 'free',
    this.subscriptionExpiresAt,
    this.revenuecatId,
    this.examDate,
    this.notificationsEnabled = true,
  });

  bool get isPremium =>
      subscriptionTier != 'free' &&
      (subscriptionExpiresAt == null ||
          subscriptionExpiresAt!.isAfter(DateTime.now()));

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      id: json['id'] as String,
      displayName: json['display_name'] as String?,
      examType: json['exam_type'] as String? ?? 'qudurat',
      totalScans: json['total_scans'] as int? ?? 0,
      subscriptionTier: json['subscription_tier'] as String? ?? 'free',
      subscriptionExpiresAt: json['subscription_expires_at'] != null
          ? DateTime.parse(json['subscription_expires_at'] as String)
          : null,
      revenuecatId: json['revenuecat_id'] as String?,
      examDate: json['exam_date'] != null
          ? DateTime.parse(json['exam_date'] as String)
          : null,
      notificationsEnabled: json['notifications_enabled'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'display_name': displayName,
        'exam_type': examType,
        'exam_date': examDate?.toIso8601String(),
        'notifications_enabled': notificationsEnabled,
      };
}
