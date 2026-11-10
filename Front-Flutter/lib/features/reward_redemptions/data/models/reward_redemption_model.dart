// SPDX-License-Identifier: Apache-2.0

class RewardRedemptionModel {
  final int id;
  final int? rewardIdId;
  final String? rewardIdName;
  final int pointsSpent;
  final bool isCancelled;
  final String? note;

  const RewardRedemptionModel({
    required this.id,
    this.rewardIdId, this.rewardIdName,
    required this.pointsSpent,
    this.isCancelled = false,
    this.note,
  });

  factory RewardRedemptionModel.fromJson(Map<String, dynamic> json) {
    return RewardRedemptionModel(
      id: json['id'] as int? ?? 0,
      rewardIdId: json['rewardIdId'] as int?,
      rewardIdName: (json['rewardId'] as Map?)?['title'] as String?,
      pointsSpent: json['pointsSpent'] as int? ?? 0,
      isCancelled: json['isCancelled'] as bool? ?? false,
      note: json['note'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'rewardIdId': rewardIdId,
        'pointsSpent': pointsSpent,
        'isCancelled': isCancelled,
        'note': note,
      };

  RewardRedemptionModel copyWith({
    Object? rewardIdId = const Object(),
    Object? rewardIdName = const Object(),
    Object? pointsSpent = const Object(),
    Object? isCancelled = const Object(),
    Object? note = const Object()
  }) {
    return RewardRedemptionModel(
      id: id,
      rewardIdId: rewardIdId == const Object() ? this.rewardIdId : rewardIdId as dynamic,
      rewardIdName: rewardIdName == const Object() ? this.rewardIdName : rewardIdName as dynamic,
      pointsSpent: pointsSpent == const Object() ? this.pointsSpent : pointsSpent as dynamic,
      isCancelled: isCancelled == const Object() ? this.isCancelled : isCancelled as dynamic,
      note: note == const Object() ? this.note : note as dynamic,
    );
  }
}
