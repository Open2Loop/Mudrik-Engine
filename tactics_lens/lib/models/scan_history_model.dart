class ScanHistoryModel {
  final String id;
  final String userId;
  final String rawText;
  final String? matchedTacticId;
  final double? matchScore;
  final String matchMethod;
  final String? aiSuggestedCategoryId;
  final double? aiConfidence;
  final DateTime scannedAt;

  const ScanHistoryModel({
    required this.id,
    required this.userId,
    required this.rawText,
    this.matchedTacticId,
    this.matchScore,
    this.matchMethod = 'keyword',
    this.aiSuggestedCategoryId,
    this.aiConfidence,
    required this.scannedAt,
  });

  factory ScanHistoryModel.fromJson(Map<String, dynamic> json) {
    return ScanHistoryModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      rawText: json['raw_text'] as String,
      matchedTacticId: json['matched_tactic_id'] as String?,
      matchScore: (json['match_score'] as num?)?.toDouble(),
      matchMethod: json['match_method'] as String? ?? 'keyword',
      aiSuggestedCategoryId: json['ai_suggested_category_id'] as String?,
      aiConfidence: (json['ai_confidence'] as num?)?.toDouble(),
      scannedAt: DateTime.parse(json['scanned_at'] as String),
    );
  }
}
