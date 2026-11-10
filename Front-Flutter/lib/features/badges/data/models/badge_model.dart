// SPDX-License-Identifier: Apache-2.0

class BadgeModel {
  final int id;
  final String name;
  final String? description;
  final String badgeType;
  final int? threshold;
  final String? iconUrl;

  const BadgeModel({
    required this.id,
    required this.name,
    this.description,
    this.badgeType = 'streak_3',
    this.threshold,
    this.iconUrl,
  });

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    return BadgeModel(
      id: json['id'] as int? ?? 0,
      name: (json['name'] as String? ?? '').trim(),
      description: json['description'] as String?,
      badgeType: json['badgeType'] as String? ?? 'streak_3',
      threshold: json['threshold'] as int?,
      iconUrl: json['iconUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'badgeType': badgeType,
        'threshold': threshold,
        'iconUrl': iconUrl,
      };

  BadgeModel copyWith({
    Object? name = const Object(),
    Object? description = const Object(),
    Object? badgeType = const Object(),
    Object? threshold = const Object(),
    Object? iconUrl = const Object()
  }) {
    return BadgeModel(
      id: id,
      name: name == const Object() ? this.name : name as dynamic,
      description: description == const Object() ? this.description : description as dynamic,
      badgeType: badgeType == const Object() ? this.badgeType : badgeType as dynamic,
      threshold: threshold == const Object() ? this.threshold : threshold as dynamic,
      iconUrl: iconUrl == const Object() ? this.iconUrl : iconUrl as dynamic,
    );
  }
}
