// SPDX-License-Identifier: Apache-2.0

class FamilieModel {
  final int id;
  final String name;
  final String? inviteCode;
  final bool approvalMode;
  final String? useTimeStart;
  final String? useTimeEnd;

  const FamilieModel({
    required this.id,
    required this.name,
    this.inviteCode,
    this.approvalMode = false,
    this.useTimeStart,
    this.useTimeEnd,
  });

  factory FamilieModel.fromJson(Map<String, dynamic> json) {
    return FamilieModel(
      id: json['id'] as int? ?? 0,
      name: (json['name'] as String? ?? '').trim(),
      inviteCode: json['inviteCode'] as String?,
      approvalMode: json['approvalMode'] as bool? ?? false,
      useTimeStart: json['useTimeStart'] as String?,
      useTimeEnd: json['useTimeEnd'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'inviteCode': inviteCode,
        'approvalMode': approvalMode,
        'useTimeStart': useTimeStart,
        'useTimeEnd': useTimeEnd,
      };

  FamilieModel copyWith({
    Object? name = const Object(),
    Object? inviteCode = const Object(),
    Object? approvalMode = const Object(),
    Object? useTimeStart = const Object(),
    Object? useTimeEnd = const Object()
  }) {
    return FamilieModel(
      id: id,
      name: name == const Object() ? this.name : name as dynamic,
      inviteCode: inviteCode == const Object() ? this.inviteCode : inviteCode as dynamic,
      approvalMode: approvalMode == const Object() ? this.approvalMode : approvalMode as dynamic,
      useTimeStart: useTimeStart == const Object() ? this.useTimeStart : useTimeStart as dynamic,
      useTimeEnd: useTimeEnd == const Object() ? this.useTimeEnd : useTimeEnd as dynamic,
    );
  }
}
