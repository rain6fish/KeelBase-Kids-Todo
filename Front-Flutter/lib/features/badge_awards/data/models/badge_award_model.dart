// SPDX-License-Identifier: Apache-2.0

class BadgeAwardModel {
  final int id;
  final int? badgeIdId;
  final String? badgeIdName;
  final String? earnedOn;

  const BadgeAwardModel({
    required this.id,
    this.badgeIdId, this.badgeIdName,
    this.earnedOn,
  });

  factory BadgeAwardModel.fromJson(Map<String, dynamic> json) {
    return BadgeAwardModel(
      id: json['id'] as int? ?? 0,
      badgeIdId: json['badgeIdId'] as int?,
      badgeIdName: (json['badgeId'] as Map?)?['name'] as String?,
      earnedOn: json['earnedOn'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'badgeIdId': badgeIdId,
        'earnedOn': earnedOn,
      };

  BadgeAwardModel copyWith({
    Object? badgeIdId = const Object(),
    Object? badgeIdName = const Object(),
    Object? earnedOn = const Object()
  }) {
    return BadgeAwardModel(
      id: id,
      badgeIdId: badgeIdId == const Object() ? this.badgeIdId : badgeIdId as dynamic,
      badgeIdName: badgeIdName == const Object() ? this.badgeIdName : badgeIdName as dynamic,
      earnedOn: earnedOn == const Object() ? this.earnedOn : earnedOn as dynamic,
    );
  }
}
