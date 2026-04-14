class TacticModel {
  final String id;
  final String categoryId;
  final String title;
  final String? description;
  final String videoUrl;
  final String thumbnailUrl;
  final int durationSeconds;
  final int difficulty;
  final int viewCount;
  final bool isFree;
  final DateTime createdAt;

  const TacticModel({
    required this.id,
    required this.categoryId,
    required this.title,
    this.description,
    required this.videoUrl,
    required this.thumbnailUrl,
    this.durationSeconds = 30,
    this.difficulty = 1,
    this.viewCount = 0,
    this.isFree = false,
    required this.createdAt,
  });

  factory TacticModel.fromJson(Map<String, dynamic> json) {
    return TacticModel(
      id: json['id'] as String,
      categoryId: json['category_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      videoUrl: json['video_url'] as String,
      thumbnailUrl: json['thumbnail_url'] as String,
      durationSeconds: json['duration_seconds'] as int? ?? 30,
      difficulty: json['difficulty'] as int? ?? 1,
      viewCount: json['view_count'] as int? ?? 0,
      isFree: json['is_free'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'category_id': categoryId,
        'title': title,
        'description': description,
        'video_url': videoUrl,
        'thumbnail_url': thumbnailUrl,
        'duration_seconds': durationSeconds,
        'difficulty': difficulty,
        'view_count': viewCount,
        'is_free': isFree,
      };
}
