class CategoryModel {
  final String id;
  final String name;
  final String examType;
  final String? iconName;
  final int displayOrder;

  const CategoryModel({
    required this.id,
    required this.name,
    required this.examType,
    this.iconName,
    this.displayOrder = 0,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      examType: json['exam_type'] as String,
      iconName: json['icon_name'] as String?,
      displayOrder: json['display_order'] as int? ?? 0,
    );
  }
}
