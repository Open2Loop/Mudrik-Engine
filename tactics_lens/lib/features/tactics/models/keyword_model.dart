class KeywordModel {
  final String id;
  final String tacticId;
  final String keyword;
  final double weight;

  const KeywordModel({
    required this.id,
    required this.tacticId,
    required this.keyword,
    this.weight = 1.0,
  });

  factory KeywordModel.fromJson(Map<String, dynamic> json) {
    return KeywordModel(
      id: json['id'] as String,
      tacticId: json['tactic_id'] as String,
      keyword: json['keyword'] as String,
      weight: (json['weight'] as num?)?.toDouble() ?? 1.0,
    );
  }
}
