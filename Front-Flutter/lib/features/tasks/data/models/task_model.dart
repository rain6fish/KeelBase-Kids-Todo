// SPDX-License-Identifier: Apache-2.0

class TaskModel {
  final int id;
  final String title;
  final String? description;
  final String? attachmentUrl;
  final String? attachmentName;
  final String priority;
  final String status;
  final String taskDate;
  final int? estimatedMinutes;
  final String repeatRule;
  final String approvalStatus;
  final bool helpRequested;
  final String? helpRequestNote;
  final int? sortOrder;

  /// 创建者（家长创建的孩子任务 userId 是家长；孩子只能改自己创建的）
  final int? userId;

  /// 服务端创建时间（ISO 8601）
  final String? createdAt;

  const TaskModel({
    required this.id,
    required this.title,
    this.description,
    this.attachmentUrl,
    this.attachmentName,
    this.priority = 'low',
    this.status = 'todo',
    required this.taskDate,
    this.estimatedMinutes,
    this.repeatRule = 'none',
    this.approvalStatus = 'none',
    this.helpRequested = false,
    this.helpRequestNote,
    this.sortOrder,
    this.userId,
    this.createdAt,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'] as int? ?? 0,
      title: (json['title'] as String? ?? '').trim(),
      description: json['description'] as String?,
      attachmentUrl: json['attachmentUrl'] as String?,
      attachmentName: json['attachmentName'] as String?,
      priority: json['priority'] as String? ?? 'low',
      status: json['status'] as String? ?? 'todo',
      taskDate: (json['taskDate'] as String? ?? '').trim(),
      estimatedMinutes: json['estimatedMinutes'] as int?,
      repeatRule: json['repeatRule'] as String? ?? 'none',
      approvalStatus: json['approvalStatus'] as String? ?? 'none',
      helpRequested: json['helpRequested'] as bool? ?? false,
      helpRequestNote: json['helpRequestNote'] as String?,
      sortOrder: json['sortOrder'] as int?,
      userId: json['userId'] as int?,
      createdAt: json['createdAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'attachmentUrl': attachmentUrl,
        'attachmentName': attachmentName,
        'priority': priority,
        'status': status,
        'taskDate': taskDate,
        'estimatedMinutes': estimatedMinutes,
        'repeatRule': repeatRule,
        'approvalStatus': approvalStatus,
        'helpRequested': helpRequested,
        'helpRequestNote': helpRequestNote,
        'sortOrder': sortOrder,
        'userId': userId,
        'createdAt': createdAt,
      };

  TaskModel copyWith({
    Object? title = const Object(),
    Object? description = const Object(),
    Object? priority = const Object(),
    Object? status = const Object(),
    Object? taskDate = const Object(),
    Object? estimatedMinutes = const Object(),
    Object? repeatRule = const Object(),
    Object? approvalStatus = const Object(),
    Object? helpRequested = const Object(),
    Object? helpRequestNote = const Object(),
    Object? sortOrder = const Object(),
    Object? userId = const Object(),
    Object? createdAt = const Object()
  }) {
    return TaskModel(
      id: id,
      title: title == const Object() ? this.title : title as dynamic,
      description: description == const Object() ? this.description : description as dynamic,
      priority: priority == const Object() ? this.priority : priority as dynamic,
      status: status == const Object() ? this.status : status as dynamic,
      taskDate: taskDate == const Object() ? this.taskDate : taskDate as dynamic,
      estimatedMinutes: estimatedMinutes == const Object() ? this.estimatedMinutes : estimatedMinutes as dynamic,
      repeatRule: repeatRule == const Object() ? this.repeatRule : repeatRule as dynamic,
      approvalStatus: approvalStatus == const Object() ? this.approvalStatus : approvalStatus as dynamic,
      helpRequested: helpRequested == const Object() ? this.helpRequested : helpRequested as dynamic,
      helpRequestNote: helpRequestNote == const Object() ? this.helpRequestNote : helpRequestNote as dynamic,
      sortOrder: sortOrder == const Object() ? this.sortOrder : sortOrder as dynamic,
      userId: userId == const Object() ? this.userId : userId as dynamic,
      createdAt: createdAt == const Object() ? this.createdAt : createdAt as dynamic,
    );
  }
}
