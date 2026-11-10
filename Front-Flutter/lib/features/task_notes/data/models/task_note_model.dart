// SPDX-License-Identifier: Apache-2.0

class TaskNoteModel {
  final int id;
  final int? taskIdId;
  final String? taskIdName;
  final String content;
  final String contentType;
  final String? mediaUrl;
  final int? userId;
  final String? createdAt;

  const TaskNoteModel({
    required this.id,
    this.taskIdId, this.taskIdName,
    required this.content,
    this.contentType = 'text',
    this.mediaUrl,
    this.userId,
    this.createdAt,
  });

  factory TaskNoteModel.fromJson(Map<String, dynamic> json) {
    return TaskNoteModel(
      id: json['id'] as int? ?? 0,
      taskIdId: json['taskIdId'] as int?,
      taskIdName: (json['taskId'] as Map?)?['title'] as String?,
      content: (json['content'] as String? ?? '').trim(),
      contentType: json['contentType'] as String? ?? 'text',
      mediaUrl: json['mediaUrl'] as String?,
      userId: json['userId'] as int?,
      createdAt: json['createdAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'taskIdId': taskIdId,
        'content': content,
        'contentType': contentType,
        'mediaUrl': mediaUrl,
        'userId': userId,
        'createdAt': createdAt,
      };

  TaskNoteModel copyWith({
    Object? taskIdId = const Object(),
    Object? taskIdName = const Object(),
    Object? content = const Object(),
    Object? contentType = const Object(),
    Object? mediaUrl = const Object()
  }) {
    return TaskNoteModel(
      id: id,
      taskIdId: taskIdId == const Object() ? this.taskIdId : taskIdId as dynamic,
      taskIdName: taskIdName == const Object() ? this.taskIdName : taskIdName as dynamic,
      content: content == const Object() ? this.content : content as dynamic,
      contentType: contentType == const Object() ? this.contentType : contentType as dynamic,
      mediaUrl: mediaUrl == const Object() ? this.mediaUrl : mediaUrl as dynamic,
    );
  }
}
