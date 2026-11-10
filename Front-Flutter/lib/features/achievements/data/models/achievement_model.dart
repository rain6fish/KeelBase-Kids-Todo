// SPDX-License-Identifier: Apache-2.0

class AchievementModel {
  final int id;
  final int? totalPoints;
  final int? currentStreak;
  final int? longestStreak;
  final String? lastActiveDate;

  const AchievementModel({
    required this.id,
    this.totalPoints,
    this.currentStreak,
    this.longestStreak,
    this.lastActiveDate,
  });

  factory AchievementModel.fromJson(Map<String, dynamic> json) {
    return AchievementModel(
      id: json['id'] as int? ?? 0,
      totalPoints: json['totalPoints'] as int?,
      currentStreak: json['currentStreak'] as int?,
      longestStreak: json['longestStreak'] as int?,
      lastActiveDate: json['lastActiveDate'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'totalPoints': totalPoints,
        'currentStreak': currentStreak,
        'longestStreak': longestStreak,
        'lastActiveDate': lastActiveDate,
      };

  AchievementModel copyWith({
    Object? totalPoints = const Object(),
    Object? currentStreak = const Object(),
    Object? longestStreak = const Object(),
    Object? lastActiveDate = const Object()
  }) {
    return AchievementModel(
      id: id,
      totalPoints: totalPoints == const Object() ? this.totalPoints : totalPoints as dynamic,
      currentStreak: currentStreak == const Object() ? this.currentStreak : currentStreak as dynamic,
      longestStreak: longestStreak == const Object() ? this.longestStreak : longestStreak as dynamic,
      lastActiveDate: lastActiveDate == const Object() ? this.lastActiveDate : lastActiveDate as dynamic,
    );
  }
}
