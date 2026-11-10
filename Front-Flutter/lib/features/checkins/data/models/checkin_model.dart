// SPDX-License-Identifier: Apache-2.0

class CheckinModel {
  final int id;
  final String checkDate;
  final int? totalTasks;
  final int? doneTasks;
  final bool isPerfect;
  final int? pointsEarned;

  const CheckinModel({
    required this.id,
    required this.checkDate,
    this.totalTasks,
    this.doneTasks,
    this.isPerfect = false,
    this.pointsEarned,
  });

  factory CheckinModel.fromJson(Map<String, dynamic> json) {
    return CheckinModel(
      id: json['id'] as int? ?? 0,
      checkDate: (json['checkDate'] as String? ?? '').trim(),
      totalTasks: json['totalTasks'] as int?,
      doneTasks: json['doneTasks'] as int?,
      isPerfect: json['isPerfect'] as bool? ?? false,
      pointsEarned: json['pointsEarned'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'checkDate': checkDate,
        'totalTasks': totalTasks,
        'doneTasks': doneTasks,
        'isPerfect': isPerfect,
        'pointsEarned': pointsEarned,
      };

  CheckinModel copyWith({
    Object? checkDate = const Object(),
    Object? totalTasks = const Object(),
    Object? doneTasks = const Object(),
    Object? isPerfect = const Object(),
    Object? pointsEarned = const Object()
  }) {
    return CheckinModel(
      id: id,
      checkDate: checkDate == const Object() ? this.checkDate : checkDate as dynamic,
      totalTasks: totalTasks == const Object() ? this.totalTasks : totalTasks as dynamic,
      doneTasks: doneTasks == const Object() ? this.doneTasks : doneTasks as dynamic,
      isPerfect: isPerfect == const Object() ? this.isPerfect : isPerfect as dynamic,
      pointsEarned: pointsEarned == const Object() ? this.pointsEarned : pointsEarned as dynamic,
    );
  }
}
