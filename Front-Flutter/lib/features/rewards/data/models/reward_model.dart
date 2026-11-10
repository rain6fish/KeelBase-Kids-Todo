// SPDX-License-Identifier: Apache-2.0

class RewardModel {
  final int id;
  final String title;
  final String? description;
  final int pointsCost;
  final bool isActive;

  const RewardModel({
    required this.id,
    required this.title,
    this.description,
    required this.pointsCost,
    this.isActive = false,
  });

  factory RewardModel.fromJson(Map<String, dynamic> json) {
    return RewardModel(
      id: json['id'] as int? ?? 0,
      title: (json['title'] as String? ?? '').trim(),
      description: json['description'] as String?,
      pointsCost: json['pointsCost'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'pointsCost': pointsCost,
        'isActive': isActive,
      };

  RewardModel copyWith({
    Object? title = const Object(),
    Object? description = const Object(),
    Object? pointsCost = const Object(),
    Object? isActive = const Object()
  }) {
    return RewardModel(
      id: id,
      title: title == const Object() ? this.title : title as dynamic,
      description: description == const Object() ? this.description : description as dynamic,
      pointsCost: pointsCost == const Object() ? this.pointsCost : pointsCost as dynamic,
      isActive: isActive == const Object() ? this.isActive : isActive as dynamic,
    );
  }
}
